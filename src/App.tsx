import "./App.css";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TextField } from "@mui/material";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import type {} from "@mui/x-date-pickers/themeAugmentation";
import React, { useEffect, useMemo } from "react";

const App: React.FunctionComponent = () => {
  type trend = {
    horizon: number;
    horizon_date: string;
    horizon_frequency: string;
    horizon_name: string;
    id: number;
    output_type: string;
    trend: number;
  };

  const heading = {
    display: "inline",
    fontSize: "16px",
    mr: "8px",
    fontWeight: "bold",
  };

  const [value, setValue] = React.useState<Date | null>(null);
  const [runsError, setRunsError] = React.useState("");
  const [trends, setTrends] = React.useState<trend[]>([]);
  const flowId = 1;
  const credentials = btoa("admin:super_secret");
  const auth = useMemo(() => {
    return { Authorization: `Basic ${credentials}` };
  }, [credentials]);

  useEffect(() => {
    const fetchHorizons = async () => {
      setRunsError("");
      setTrends([]);

      // format date in iso8601 format
      const formattedDate = value?.toISOString().slice(0, 10) + "T00:00:00Z";

      // fetch run with the date
      const runRes = await fetch(
        `https://test-backend.i.datapred.com/flows/${flowId}/runs?production_date=${formattedDate}`,
        { headers: auth }
      );

      // check if there is a run for the date specified
      if (!runRes.ok) {
        console.log(runRes);
        setRunsError("no run avaible for this date");
        return;
      }
      const runResJson = await runRes.json();
      const run = runResJson.results[0];

      // check if the found run is complete
      if (!run.complete) {
        setRunsError("no complete run for this date");
        return;
      }

      // fetch outputs with the found run ID
      const elOutputs = await (
        await fetch(
          `https://test-backend.i.datapred.com/flows/${flowId}/runs/${run.id}/outputs`,
          { headers: auth }
        )
      ).json();

      // fetch trends for each output
      elOutputs.results.forEach(async (output: { run: any; id: any }) => {
        const outputTrends = await (
          await fetch(
            `https://test-backend.i.datapred.com/flows/${flowId}/runs/${output.run}/outputs/${output.id}/trends`,
            { headers: auth }
          )
        ).json();
        console.log(outputTrends);
        setTrends(outputTrends.results);
      });
    };

    if (value) {
      fetchHorizons();
    }
  }, [auth, value]);

  return (
    <div className="App">
      <div
        className="container"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Production date"
            value={value}
            onChange={(newValue) => {
              console.log(newValue);
              setValue(newValue);
            }}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>
        <Box className="results" sx={{ ml: "20px" }}>
          {!runsError &&
            trends.map((trend) => (
              <Paper
                sx={{
                  mb: "20px",
                  backgroundColor: "#90ee90",
                  padding: "10px 20px",
                }}
                key={`trend-${trend.id}`}
              >
                <Typography variant="h2" sx={heading}>
                  Date:
                </Typography>
                <span>
                  {trend.horizon_date.slice(0, 10).replaceAll("-", " ")}
                </span>
                <br />
                <Typography variant="h2" sx={heading}>
                  Name:
                </Typography>
                <span>{trend.horizon_name}</span>
                <br />
                <Typography variant="h2" sx={heading}>
                  Trend:
                </Typography>
                <span>{trend.trend}</span>
              </Paper>
            ))}
          {runsError && (
            <Paper
              sx={{
                backgroundColor: "#ffcccb",
                padding: "10px 20px",
              }}
            >
              {runsError}
            </Paper>
          )}
        </Box>
      </div>
    </div>
  );
};

export default App;
