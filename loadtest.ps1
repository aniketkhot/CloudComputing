$API = "http://16.176.198.62:8080"
$JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NjQzNzM5NCwiZXhwIjoxNzU2NDQwOTk0fQ.mP4BgOyFfrqAWvXMtwUEu1-6N_XCV6TwsKQuLIL1Zxk"
$FILE_ID = "zCyRGaC-46AoWnpeTfZxi"
$N = 15

Write-Host "Starting $N concurrent transcode requests..."

$jobs = 1..$N | ForEach-Object {
    Start-Job {
        param($API, $JWT, $FILE_ID)
        Invoke-RestMethod -Uri "$API/api/transcode" -Method POST `
            -Headers @{ "Authorization" = "Bearer $JWT"; "Content-Type" = "application/json" } `
            -Body (@{ fileId = $FILE_ID; preset = "720p" } | ConvertTo-Json -Compress)
    } -ArgumentList $API, $JWT, $FILE_ID
}

$results = $jobs | Wait-Job | Receive-Job
$results | ConvertTo-Json -Depth 3
