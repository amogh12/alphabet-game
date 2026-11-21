# Generates phoneme + word WAV files using Windows built-in TTS
# Run once from project root: powershell -ExecutionPolicy Bypass -File generate-phonics-audio.ps1

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Pick Zira (female, cleaner) if available, else default
$zira = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -like "*Zira*" } | Select-Object -First 1
if ($zira) {
    $synth.SelectVoice($zira.VoiceInfo.Name)
    Write-Host "Voice: $($zira.VoiceInfo.Name)"
} else {
    Write-Host "Voice: $($synth.Voice.Name) (Zira not found)"
}

$outDir = "$PSScriptRoot\audio\phonics"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Write-Host "Output: $outDir`n"

# Phoneme sounds — tuned for clarity
$phonemes = [ordered]@{
    'a' = 'aah';  'b' = 'buh';  'c' = 'kuh';  'd' = 'duh';  'e' = 'eh';
    'f' = 'fff';  'g' = 'guh';  'h' = 'huh';  'i' = 'ih';   'j' = 'juh';
    'k' = 'kuh';  'l' = 'lll';  'm' = 'mmm';  'n' = 'nnn';  'o' = 'aw';
    'p' = 'puh';  'q' = 'kwuh'; 'r' = 'rrr';  's' = 'sss';  't' = 'tuh';
    'u' = 'uh';   'v' = 'vvv';  'w' = 'wuh';  'x' = 'ksss'; 'y' = 'yuh'; 'z' = 'zzz'
}

# Slow rate for phonemes so they sound distinct (-10 to 10, default 0)
$synth.Rate = -3
$synth.Volume = 100

foreach ($letter in $phonemes.Keys) {
    $file = "$outDir\$letter.wav"
    $synth.SetOutputToWaveFile($file)
    $synth.Speak($phonemes[$letter])
    Write-Host "  $letter.wav  ->  '$($phonemes[$letter])'"
}

# Normal rate for full words
$synth.Rate = -1
$words = @('cat','dog','sun','hat','pig','bus','cup','hen','ant','owl','bee','map','jam','net','pot')

Write-Host ""
foreach ($word in $words) {
    $file = "$outDir\$word.wav"
    $synth.SetOutputToWaveFile($file)
    $synth.Speak($word)
    Write-Host "  $word.wav"
}

$synth.SetOutputToDefaultAudioDevice()
$synth.Dispose()

Write-Host "`nDone! $($phonemes.Count + $words.Count) files generated."
Write-Host "Now commit the audio/ folder and push."
