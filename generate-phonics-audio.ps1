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

# Plain-text phonemes — TTS reads these naturally as sounds (not letter names)
$plainPhonemes = [ordered]@{
    'a' = 'aah';  'b' = 'buh';  'c' = 'kuh';  'd' = 'duh';  'e' = 'eh';
    'g' = 'guh';  'h' = 'huh';  'i' = 'ih';   'j' = 'juh';
    'k' = 'kuh';  'o' = 'aw';
    'p' = 'puh';  'q' = 'kwuh'; 't' = 'tuh';
    'u' = 'uh';   'w' = 'wuh';  'y' = 'yuh'
}

# SSML phonemes — repeated letters like "sss" get read as letter names by TTS.
# Use x-microsoft-sapi phoneme codes to force the actual consonant sounds.
# ph="S S S" = three /s/ phonemes in sequence = prolonged hiss.
$ssmlPhonemes = [ordered]@{
    'f' = 'F F F F';    # voiceless labiodental fricative
    'l' = 'L L L';      # alveolar lateral
    'm' = 'M M M';      # bilabial nasal
    'n' = 'N N N';      # alveolar nasal
    'r' = 'R R R';      # approximant
    's' = 'S S S S';    # voiceless alveolar fricative
    'v' = 'V V V';      # voiced labiodental fricative
    'x' = 'K S S S';    # /k/ + prolonged /s/ for "ks" sound
    'z' = 'Z Z Z'       # voiced alveolar fricative
}

$synth.Rate = -3
$synth.Volume = 100

# Plain text phonemes
foreach ($letter in $plainPhonemes.Keys) {
    $file = "$outDir\$letter.wav"
    $synth.SetOutputToWaveFile($file)
    $synth.Speak($plainPhonemes[$letter])
    Write-Host "  $letter.wav  ->  '$($plainPhonemes[$letter])'"
}

# SSML phonemes
$ssmlNs = 'http://www.w3.org/2001/10/synthesis'
foreach ($letter in $ssmlPhonemes.Keys) {
    $ph = $ssmlPhonemes[$letter]
    $ssml = "<?xml version='1.0'?><speak version='1.0' xmlns='$ssmlNs' xml:lang='en-US'><phoneme alphabet='x-microsoft-sapi' ph='$ph'>$letter</phoneme></speak>"
    $file = "$outDir\$letter.wav"
    $synth.SetOutputToWaveFile($file)
    $synth.SpeakSsml($ssml)
    Write-Host "  $letter.wav  ->  SSML ph='$ph'"
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

Write-Host "`nDone! $($plainPhonemes.Count + $ssmlPhonemes.Count + $words.Count) files generated."
Write-Host "Now commit the audio/ folder and push."
