from __future__ import annotations

from statistics import mean
from textwrap import dedent

from app.schemas import FinancialPoint


def build_mock_analysis(prompt: str, financial_data: list[FinancialPoint]) -> dict[str, str]:
    points = financial_data or [
        FinancialPoint(period="Now", revenue=100, expenses=65, cashflow=28),
        FinancialPoint(period="Next", revenue=108, expenses=67, cashflow=31),
    ]

    first = points[0]
    last = points[-1]

    revenue_growth = ((last.revenue - first.revenue) / first.revenue) * 100 if first.revenue else 0
    avg_margin = mean(
        ((point.revenue - point.expenses) / point.revenue) * 100 if point.revenue else 0 for point in points
    )
    cashflow_direction = "strengthening" if last.cashflow >= first.cashflow else "softening"
    dominant_focus = prompt.strip().rstrip(".")

    insight = (
        f"{dominant_focus.capitalize()} maps well to the current portfolio trend. Revenue expanded by "
        f"{revenue_growth:.1f}% across the sampled periods while average operating margin held near {avg_margin:.1f}%. "
        f"Cashflow is {cashflow_direction}, which suggests the signal is resilient enough to promote into an analyst review queue."
    )

    rule = (
        "IF revenue growth exceeds 8% over the observed window AND average operating margin stays above 30% "
        f"AND cashflow remains {cashflow_direction}, THEN flag the company as a high-priority AI opportunity; "
        "otherwise keep the company in monitor mode and require manual approval before escalation."
    )

    code = dedent(
        f"""
        from dataclasses import dataclass


        @dataclass
        class FinancialSnapshot:
            revenue_growth: float
            average_margin: float
            cashflow_trend: str


        def classify_signal(snapshot: FinancialSnapshot) -> str:
            if (
                snapshot.revenue_growth > 8
                and snapshot.average_margin > 30
                and snapshot.cashflow_trend == "{cashflow_direction}"
            ):
                return "high_priority"
            if snapshot.revenue_growth > 4:
                return "monitor"
            return "manual_review"
        """
    ).strip()

    return {
        "insight": insight,
        "rule": rule,
        "code": code,
    }
