"""
Seasonal patterns in Toronto Persons in Crisis calls (2014-2024)
================================================================

This script reproduces the seasonal-index analysis and the small-multiples
chart shown in the project pitch deck. It uses the Toronto Police Service
"Persons in Crisis Calls for Service Attended" open dataset.

Why a seasonal index?
---------------------
Raw monthly counts mix two things together: how much calls grow year-over-year
(long-run trend), and how much they vary within a single year (seasonality).
We want to isolate the second one. The seasonal index does this by expressing
each month as a percentage of that call type's annual mean — so a value of 109
means "this month sees 9% more calls than the typical month for this call type."
This makes it fair to compare patterns across call types that have very
different absolute volumes.

What the script produces:
- Console output: the seasonal index table per event type
- Figure 1: small-multiples line chart (one panel per event type)
- Figure 2: single combined chart with all three lines (alternative view)
- Figure 3: heatmap-style view (month x event type, useful for reports)

Dependencies:
    pip install pandas matplotlib numpy
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from pathlib import Path


# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------

# Path to the CSV. Change this if your file lives somewhere else.
CSV_PATH = Path(
    "Persons_in_Crisis_Calls_for_Service_Attended_Open_Data_3801289854217715978.csv"
)

# Years to include in the analysis. We use full years only — partial years
# (e.g. data that ends mid-year) would distort the seasonal index because
# some months would be sampled fewer times than others.
START_YEAR = 2014
END_YEAR = 2024  # inclusive

# The palette from the deck — warm civic-design feel.
# Each event type gets its own colour, used consistently across charts.
COLORS = {
    "Person in Crisis": "#B89D42",  # terracotta (the primary signal)
    "Suicide-related":  "#444A46",  # slate (the flatter cycle)
    "Overdose":         "#57D968",  # ember (delayed summer peak)
}

# Background and text colours, also matching the deck.
PAPER = "#FFFFFF"
INK = "#1F1A17"
ASH = "#8C857B"
RULE = "#D9CDB8"

# Output directory for saved figures.
OUT_DIR = Path("./charts")
OUT_DIR.mkdir(exist_ok=True)


# ----------------------------------------------------------------------
# Step 1 — Load the data and clean it
# ----------------------------------------------------------------------

def load_data(path: Path) -> pd.DataFrame:
    """
    Read the CSV and apply two small but important cleaning steps:

    1. Force EVENT_MONTH into a categorical with the correct calendar order.
       By default pandas would sort months alphabetically (April first, then
       August, etc.), which would scramble the seasonal chart entirely.

    2. Restrict to full years only. Keeping partial years would bias the
       seasonal index: a month sampled across 11 years should be compared
       to other months also sampled 11 times, not 10 or 12.
    """
    df = pd.read_csv(path)

    # The month order matters for the chart's x-axis and for any groupby
    # that sorts by month. Categorical with `ordered=True` makes pandas
    # respect this order downstream.
    month_order = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]
    df["EVENT_MONTH"] = pd.Categorical(
        df["EVENT_MONTH"], categories=month_order, ordered=True
    )

    # Filter to full years.
    df = df[(df["EVENT_YEAR"] >= START_YEAR) & (df["EVENT_YEAR"] <= END_YEAR)]

    return df


# ----------------------------------------------------------------------
# Step 2 — Compute the seasonal index
# ----------------------------------------------------------------------

def compute_seasonal_index(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build a 12-row x 3-column table where rows are months, columns are
    event types, and values are the seasonal index (100 = annual average).

    The calculation has three sub-steps that are easier to follow if you
    print the intermediate DataFrames while learning:

      a) Count calls per (month, event_type) across all years
      b) Divide by the number of years to get "average calls per month per year"
      c) For each event type, divide each month's value by that column's
         annual mean and multiply by 100 — giving the index where the
         per-type annual mean is normalized to 100.

    Step (c) is the conceptual heart of the analysis. Without it, the
    Person in Crisis curve would dwarf the Overdose curve on any chart
    because there are roughly five times more Person in Crisis calls
    overall, even though the shape of their seasonal cycles is what
    we actually want to compare.
    """
    n_years = df["EVENT_YEAR"].nunique()

    # (a) and (b) combined: counts per (month, type), averaged across years.
    # `observed=True` suppresses a pandas FutureWarning about categorical groupby.
    monthly_avg = (
        df.groupby(["EVENT_MONTH", "EVENT_TYPE"], observed=True)
          .size()
          .unstack(fill_value=0)
        / n_years
    )

    # (c) Normalize each column so that its annual mean = 100.
    # `monthly_avg.mean()` returns the per-column mean (one value per type).
    # Dividing the table by that Series broadcasts column-wise — which is
    # exactly what we want.
    seasonal_index = (monthly_avg / monthly_avg.mean()) * 100

    return seasonal_index


# ----------------------------------------------------------------------
# Step 3 — Chart styling helper
# ----------------------------------------------------------------------

def apply_civic_style(ax, title: str = None, color_accent: str = None):
    """
    Apply consistent styling to a matplotlib axes object. Extracted into
    its own function so all the charts share the same look — much easier
    than copying the styling code into every chart function.

    Design choices worth knowing:
    - We hide the top and right spines (the box edges). This is the
      "Tufte-style" approach: remove non-data ink so the data speaks.
    - We use light horizontal gridlines only. Vertical gridlines on a
      line chart over months tend to compete with the data.
    - We set the y-axis range to 80-115 so all panels share the same
      scale, making cross-panel comparison fair.
    """
    ax.set_facecolor(PAPER)

    # Hide top and right spines; keep left and bottom but recolour them subtly.
    for side in ["top", "right"]:
        ax.spines[side].set_visible(False)
    for side in ["left", "bottom"]:
        ax.spines[side].set_color(RULE)
        ax.spines[side].set_linewidth(0.8)

    # Light horizontal gridlines, no vertical ones.
    ax.grid(axis="y", color=RULE, linewidth=0.6, alpha=0.8)
    ax.grid(axis="x", visible=False)
    ax.set_axisbelow(True)  # gridlines behind the data, not on top of it

    # Tick label colours.
    ax.tick_params(colors=ASH, labelsize=9)
    for label in ax.get_xticklabels() + ax.get_yticklabels():
        label.set_color(ASH)

    # Shared y-axis range for fair cross-panel comparison.
    ax.set_ylim(80, 115)

    # A subtle horizontal line at y=100 to mark "annual average."
    # This anchor makes the deviation visible at a glance — without it,
    # the eye has to mentally locate "100" on the axis every time.
    ax.axhline(100, color=ASH, linewidth=0.8, linestyle="--", alpha=0.5)

    if title:
        # Title sits inside a coloured strip at the top of the axes.
        # This visual treatment makes the chart feel like a card.
        ax.set_title(title, color=color_accent or INK, fontsize=11,
                     fontweight="bold", pad=12, loc="left")


# ----------------------------------------------------------------------
# Step 4 — Chart 1: small multiples (one panel per event type)
# ----------------------------------------------------------------------

def chart_small_multiples(seasonal_index: pd.DataFrame, save_path: Path):
    """
    Three panels side-by-side, one per event type. This is the chart
    shown in the deck. It works because the three seasonal cycles have
    genuinely different shapes — overlaying them on one chart would
    mask those differences.

    Each panel:
    - Same y-axis (80 to 115) so heights are directly comparable
    - Same x-axis (Jan to Dec) so phases are directly comparable
    - A coloured marker on the peak month — drawing the eye to the
      most important data point in the panel
    - The peak month annotated with text, so the reader gets the
      takeaway without having to read the axis
    """
    types = ["Person in Crisis", "Suicide-related", "Overdose"]

    # 1 row, 3 columns. sharey=True is the key argument here — it makes
    # all three panels share the same y-axis range automatically.
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.5), sharey=True)
    fig.patch.set_facecolor(PAPER)

    short_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    x_positions = np.arange(12)

    for ax, event_type in zip(axes, types):
        color = COLORS[event_type]
        values = seasonal_index[event_type].values

        apply_civic_style(ax, title=event_type.upper(), color_accent=color)

        # Main line with circle markers.
        ax.plot(x_positions, values,
                color=color, linewidth=2.8,
                marker="o", markersize=7,
                markerfacecolor=color, markeredgecolor=PAPER,
                markeredgewidth=1.5)

        # Highlight the peak month with a larger marker and a label.
        # This is the "punchline" of each panel — the single number
        # the reader should walk away remembering.
        peak_idx = int(np.argmax(values))
        peak_val = values[peak_idx]
        ax.plot(peak_idx, peak_val,
                marker="o", markersize=14,
                markerfacecolor=color, markeredgecolor=PAPER,
                markeredgewidth=2.5, zorder=5)
        ax.annotate(
            f"{short_months[peak_idx]}\n{peak_val:.0f}",
            xy=(peak_idx, peak_val),
            xytext=(0, 14), textcoords="offset points",
            ha="center", va="bottom",
            fontsize=10, fontweight="bold", color=color,
        )

        ax.set_xticks(x_positions)
        ax.set_xticklabels(short_months)

    # Y-axis label only on the leftmost panel — adding it to all three
    # would be redundant since they share the axis.
    axes[0].set_ylabel("Seasonal index (100 = annual average)",
                       color=ASH, fontsize=10)

    # Overall figure title and source line, aligned to the left.
    # We place the title and subtitle as separate fig.text calls (rather than
    # using suptitle) so we have precise control over their vertical positions.
    # The y values are in figure-relative coordinates (0=bottom, 1=top).
    fig.text(
        0.02, 0.97,
        "Three call types, three seasonal shapes",
        fontsize=16, fontweight="bold", color=INK, ha="left", va="top",
    )
    fig.text(
        0.02, 0.92,
        f"Toronto Police Service · Persons in Crisis calls, {START_YEAR}–{END_YEAR}",
        fontsize=10, color=ASH, style="italic", ha="left", va="top",
    )

    # tight_layout's rect leaves the top 12% of the figure for our title/subtitle
    plt.tight_layout(rect=[0, 0, 1, 0.88])
    plt.savefig(save_path, dpi=200, facecolor=PAPER, bbox_inches="tight")
    plt.close()
    print(f"  Saved: {save_path}")


# ----------------------------------------------------------------------
# Step 5 — Chart 2: single combined chart (all three lines together)
# ----------------------------------------------------------------------

def chart_combined(seasonal_index: pd.DataFrame, save_path: Path):
    """
    The same data on a single chart with all three lines overlaid.
    This is a useful alternative because it lets you see relative timing
    at a glance — for example, the fact that Overdose peaks in August
    while the other two peak in May becomes one visual fact, not three.

    The trade-off versus small multiples: shape comparison is harder
    when lines are close together or cross, but timing comparison is
    much easier because everything is on the same horizontal axis.

    Choose this view when timing is the question. Choose small multiples
    when shape is the question.
    """
    fig, ax = plt.subplots(figsize=(11, 5.5))
    fig.patch.set_facecolor(PAPER)
    apply_civic_style(ax)

    short_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    x_positions = np.arange(12)

    for event_type in ["Person in Crisis", "Suicide-related", "Overdose"]:
        color = COLORS[event_type]
        values = seasonal_index[event_type].values
        ax.plot(x_positions, values,
                color=color, linewidth=2.6,
                marker="o", markersize=6,
                markerfacecolor=color, markeredgecolor=PAPER,
                markeredgewidth=1.2,
                label=event_type)

    ax.set_xticks(x_positions)
    ax.set_xticklabels(short_months)
    ax.set_ylabel("Seasonal index (100 = annual average)",
                  color=ASH, fontsize=11)

    # Legend styling: no frame (cleaner), positioned in the lower-left
    # because that's the quietest quadrant of this particular chart
    # (the lines all dip there in February, leaving empty space).
    legend = ax.legend(
        loc="lower right", frameon=False,
        fontsize=10, labelcolor=INK,
    )

    # Title positioned with a slight offset from the top, with subtitle below.
    # Using fig.text for both gives precise control over their positioning,
    # avoiding the overlap that happens with ax.set_title + fig.text combos.
    fig.text(
        0.08, 0.96,
        "Seasonal cycle of crisis calls, by type",
        fontsize=15, fontweight="bold", color=INK, ha="left", va="top",
    )
    fig.text(
        0.08, 0.91,
        f"Toronto Police Service · {START_YEAR}–{END_YEAR}  ·  "
        f"100 = each call type's annual average",
        fontsize=9, color=ASH, style="italic", ha="left", va="top",
    )

    plt.tight_layout(rect=[0, 0, 1, 0.87])
    plt.savefig(save_path, dpi=200, facecolor=PAPER, bbox_inches="tight")
    plt.close()
    print(f"  Saved: {save_path}")


# ----------------------------------------------------------------------
# Step 6 — Chart 3: heatmap (good for reports/papers)
# ----------------------------------------------------------------------

def chart_heatmap(seasonal_index: pd.DataFrame, save_path: Path):
    """
    A heatmap with months on the x-axis and event types on the y-axis.
    Cells are coloured by seasonal index value. This view is dense and
    great for a written report — it shows all 36 (12 months × 3 types)
    data points in one grid, with the numerical value printed in each cell.

    The diverging colour scale (anchored at 100) is important: warm colours
    for "above average," cool for "below average." That way the pattern
    of seasonality is visible at a glance even without reading the numbers.
    """
    types_in_order = ["Person in Crisis", "Suicide-related", "Overdose"]
    short_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # Transpose so event types become rows (y-axis) and months stay columns.
    data = seasonal_index[types_in_order].T.values

    fig, ax = plt.subplots(figsize=(11, 3.5))
    fig.patch.set_facecolor(PAPER)

    # Diverging colormap centered on 100. We pick "RdBu_r" (reversed) so
    # red is high and blue is low, matching the intuitive "hot = above average."
    # The vmin/vmax are set symmetrically around 100 to ensure the colour
    # scale is centered properly.
    spread = max(abs(data - 100).max(), 12)  # at least ±12 for visibility
    im = ax.imshow(
        data, aspect="auto", cmap="RdBu_r",
        vmin=100 - spread, vmax=100 + spread,
    )

    # Print the numeric value inside each cell.
    # Text colour adapts to cell brightness so the number stays legible.
    for i in range(data.shape[0]):
        for j in range(data.shape[1]):
            val = data[i, j]
            # If the cell is strongly coloured, use white text; otherwise dark.
            text_color = "white" if abs(val - 100) > spread * 0.6 else INK
            ax.text(j, i, f"{val:.0f}",
                    ha="center", va="center",
                    color=text_color, fontsize=10, fontweight="bold")

    ax.set_xticks(np.arange(12))
    ax.set_xticklabels(short_months)
    ax.set_yticks(np.arange(len(types_in_order)))
    ax.set_yticklabels(types_in_order)

    # Remove tick marks themselves (the lines), keep labels.
    ax.tick_params(length=0, colors=INK, labelsize=10)
    for spine in ax.spines.values():
        spine.set_visible(False)

    # Colorbar to the right showing the index scale.
    cbar = fig.colorbar(im, ax=ax, fraction=0.025, pad=0.02)
    cbar.set_label("Seasonal index", color=ASH, fontsize=9)
    cbar.ax.tick_params(colors=ASH, labelsize=8)
    cbar.outline.set_visible(False)

    ax.set_title(
        "Seasonal index by call type and month",
        fontsize=14, fontweight="bold", color=INK, loc="left", pad=12,
    )

    plt.tight_layout()
    plt.savefig(save_path, dpi=200, facecolor=PAPER, bbox_inches="tight")
    plt.close()
    print(f"  Saved: {save_path}")


# ----------------------------------------------------------------------
# Step 7 — Run everything
# ----------------------------------------------------------------------

def main():
    print(f"Loading data from {CSV_PATH.name}...")
    df = load_data(CSV_PATH)
    print(f"  Rows after filtering to {START_YEAR}–{END_YEAR}: {len(df):,}")
    print(f"  Event types: {sorted(df['EVENT_TYPE'].unique())}")

    print("\nComputing seasonal index...")
    seasonal = compute_seasonal_index(df)
    print(seasonal.round(1))

    print("\nGenerating charts...")
    chart_small_multiples(seasonal, OUT_DIR / "seasonal_small_multiples.png")
    chart_combined(seasonal, OUT_DIR / "seasonal_combined.png")
    chart_heatmap(seasonal, OUT_DIR / "seasonal_heatmap.png")

    print(f"\nAll charts saved to {OUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
