import pytest
from datetime import date, timedelta
from unittest.mock import MagicMock, patch
import numpy as np
import pandas as pd
from app.services.analysis.dashboard_service import get_journal_insights, _calculate_t_test, _calculate_confidence_interval
from app.models.database import DailyMetrics

# Mock data generator
def create_mock_metrics(user_id, days=30, habit_pattern=None):
    metrics = []
    base_date = date(2023, 1, 1)
    
    for i in range(days):
        current_date = base_date + timedelta(days=i)
        
        # Default values
        recovery = 50.0
        extra = {}
        
        if habit_pattern:
            # Apply habit pattern (e.g., alcohol -> lower recovery next day)
            # We set the habit on day i, and it affects recovery on day i+1
            is_habit_day = habit_pattern(i)
            if is_habit_day:
                extra = {"Alcohol": "Yes"}
            
            # If previous day had habit, lower recovery
            if i > 0 and habit_pattern(i-1):
                recovery = 30.0  # Low recovery after alcohol
            elif i > 0:
                recovery = 80.0  # High recovery otherwise
                
        metrics.append(DailyMetrics(
            user_id=user_id,
            date=current_date,
            recovery_score=recovery,
            strain_score=10.0,
            extra=extra
        ))
    return metrics

def test_calculate_t_test_scipy_mock():
    """Test t-test calculation with mocked scipy."""
    group1 = [10, 12, 11, 13, 12]
    group2 = [20, 22, 21, 23, 22]
    
    # Mock scipy to ensure we test the happy path
    with patch('app.services.analysis.dashboard_service.SCIPY_AVAILABLE', True):
        with patch('app.services.analysis.dashboard_service.scipy_stats') as mock_stats:
            mock_stats.ttest_ind.return_value = (-10.0, 0.001)
            t_stat, p_val = _calculate_t_test(group1, group2)
            assert t_stat == -10.0
            assert p_val == 0.001

def test_calculate_t_test_manual():
    """Test manual t-test calculation (fallback)."""
    group1 = [10, 10, 10, 10, 10]
    group2 = [20, 20, 20, 20, 20]
    
    with patch('app.services.analysis.dashboard_service.SCIPY_AVAILABLE', False):
        t_stat, p_val = _calculate_t_test(group1, group2)
        # Mean diff is -10. Variance is 0 (undefined t-test usually, but our code handles it or returns 0 var)
        # Let's use slightly varied data to avoid division by zero if implementation doesn't handle 0 variance perfectly
        group1 = [9, 11, 10]
        group2 = [19, 21, 20]
        t_stat, p_val = _calculate_t_test(group1, group2)
        
        assert t_stat < -5.0  # Should be significantly negative
        assert p_val < 0.05   # Should be significant

def test_get_journal_insights_alcohol_impact():
    """Test that alcohol correctly shows as negative impact."""
    user_id = "test_user"
    
    # Pattern: Alcohol every other day
    # Day 0: Alcohol -> Day 1: 30% recovery
    # Day 1: No Alcohol -> Day 2: 80% recovery
    metrics = create_mock_metrics(user_id, days=30, habit_pattern=lambda i: i % 2 == 0)
    
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = metrics
    
    insights = get_journal_insights(mock_db, user_id)
    
    assert len(insights) >= 1
    alcohol_insight = next((i for i in insights if i.data['factor_key'] == 'Alcohol'), None)
    
    assert alcohol_insight is not None
    assert alcohol_insight.data['impact_val'] < -20  # Expect large negative impact (30 vs 80)
    assert alcohol_insight.data['is_significant'] is True
    assert "Alcohol" in alcohol_insight.title

def test_get_journal_insights_no_data():
    """Test handling of insufficient data."""
    user_id = "test_user"
    metrics = create_mock_metrics(user_id, days=5) # Less than 7 days
    
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = metrics
    
    insights = get_journal_insights(mock_db, user_id)
    assert len(insights) == 0

def test_get_journal_insights_insufficient_occurrences():
    """Test that factors with too few occurrences are ignored."""
    user_id = "test_user"
    # Alcohol only once
    metrics = create_mock_metrics(user_id, days=30, habit_pattern=lambda i: i == 0)
    
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = metrics
    
    insights = get_journal_insights(mock_db, user_id)
    # Should be empty because we need at least 3 occurrences
    alcohol_insight = next((i for i in insights if i.data.get('factor_key') == 'Alcohol'), None)
    assert alcohol_insight is None
