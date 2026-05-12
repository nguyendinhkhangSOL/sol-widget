# Tạo 5 file audio silent valid (WAV format, 30s, ~480KB mỗi file)
# Browser HTML5 audio play được dù extension .mp3 (auto-detect by content).
#
# Run: powershell -ExecutionPolicy Bypass -File generate-silent.ps1

$durationSec = 30
$sampleRate = 8000  # 8kHz mono = nhỏ size, browser vẫn play OK
$numSamples = $durationSec * $sampleRate
$dataSize = $numSamples * 2  # 16-bit mono
$fileSize = 36 + $dataSize

# Build WAV header (44 bytes) + silent data (all zeros)
$buffer = New-Object byte[] (44 + $dataSize)

# RIFF chunk
[System.Text.Encoding]::ASCII.GetBytes('RIFF').CopyTo($buffer, 0)
[BitConverter]::GetBytes([UInt32]$fileSize).CopyTo($buffer, 4)
[System.Text.Encoding]::ASCII.GetBytes('WAVE').CopyTo($buffer, 8)

# fmt subchunk
[System.Text.Encoding]::ASCII.GetBytes('fmt ').CopyTo($buffer, 12)
[BitConverter]::GetBytes([UInt32]16).CopyTo($buffer, 16)       # fmt chunk size
[BitConverter]::GetBytes([UInt16]1).CopyTo($buffer, 20)         # PCM format
[BitConverter]::GetBytes([UInt16]1).CopyTo($buffer, 22)         # mono
[BitConverter]::GetBytes([UInt32]$sampleRate).CopyTo($buffer, 24)
[BitConverter]::GetBytes([UInt32]($sampleRate * 2)).CopyTo($buffer, 28)  # byte rate
[BitConverter]::GetBytes([UInt16]2).CopyTo($buffer, 32)         # block align
[BitConverter]::GetBytes([UInt16]16).CopyTo($buffer, 34)        # bits per sample

# data subchunk
[System.Text.Encoding]::ASCII.GetBytes('data').CopyTo($buffer, 36)
[BitConverter]::GetBytes([UInt32]$dataSize).CopyTo($buffer, 40)

# Audio data: tất cả zeros (silent) — Buffer.alloc đã 0 sẵn

# Write 5 file
$files = @(
    'khang-day-0-welcome.mp3',
    'khang-lapse-friendly.mp3',
    'khang-crisis-90s.mp3',
    'khang-day-7-report.mp3',
    'khang-day-14-milestone.mp3'
)

foreach ($f in $files) {
    [System.IO.File]::WriteAllBytes("$PSScriptRoot\$f", $buffer)
    $size = [Math]::Round((Get-Item "$PSScriptRoot\$f").Length / 1024, 1)
    Write-Host "✅ $f ($size KB)"
}

Write-Host "Done. Browser play được 30s silent."
