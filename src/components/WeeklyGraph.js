import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getWeeklyGraphData } from "../utils/localStorage";
import devLog from "../utils/devLog";
import "./WeeklyGraph.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

function WeeklyGraph({ onRefresh }) {
  const [graphData, setGraphData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const graphRef = useRef(null);

  useEffect(() => {
    loadGraphData();
  }, [onRefresh]);

  const loadGraphData = () => {
    const data = getWeeklyGraphData();
    setGraphData(data);
  };

  const exportToImage = async () => {
    if (!graphRef.current) return;

    setExporting(true);

    try {
      const canvas = await html2canvas(graphRef.current, {
        backgroundColor: "#0A0A0A",
        scale: 2,
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date().toLocaleDateString("en-US").replace(/\//g, "-");
        link.download = `nutrinoteplus-progress-${date}.png`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        setExporting(false);
      });
    } catch (error) {
      devLog.error("Error exporting graph:", error);
      alert("Failed to export graph. Please try again.");
      setExporting(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,

    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: "500",
          },
        },
      },

      title: {
        display: true,
        text: "7-Day Calorie Trends",
        font: {
          size: 18,
          weight: "bold",
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },

      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += context.parsed.y.toLocaleString() + " cal";
            return label;
          },
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value.toLocaleString() + " cal";
          },
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },

      x: {
        ticks: {
          font: {
            size: 12,
            weight: "500",
          },
        },
        grid: {
          display: false,
        },
      },
    },

    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  return (
    <div className="weekly-graph" ref={graphRef}>
      <div className="graph-header-with-export">
        <h3>7-Day Calorie Trends</h3>
        <button
          className="btn-export"
          onClick={exportToImage}
          disabled={exporting}
        >
          {exporting ? "Exporting..." : "Save as Image"}
        </button>
      </div>

      <div className="graph-container">
        {graphData ? (
          <Line data={graphData} options={options} />
        ) : (
          <div className="graph-loading">
            <p>Loading graph data...</p>
          </div>
        )}
      </div>

      <div className="graph-info">
        <h4>How to Read This Graph</h4>
        <div className="graph-legend-items">
          <div className="legend-item">
            <span className="legend-color eaten"></span>
            <strong>Red Line (Eaten):</strong> Total calories consumed each day
          </div>
          <div className="legend-item">
            <span className="legend-color burned"></span>
            <strong>Orange Line (Burned):</strong> Calories burned through
            exercise
          </div>
          <div className="legend-item">
            <span className="legend-color target"></span>
            <strong>Blue Dashed Line (Target):</strong> Your daily calorie goal
          </div>
        </div>
        <p className="graph-tip">
          <strong>Tip:</strong> Hover over any point to see exact values!
        </p>
      </div>
    </div>
  );
}

export default WeeklyGraph;
