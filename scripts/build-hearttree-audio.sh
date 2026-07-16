#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets-src/audio/hearttree/source"
MASTER="$ROOT/assets-src/audio/hearttree/master"
OUT="$ROOT/public/audio/wilds/hearttree"
mkdir -p "$MASTER" "$OUT"

encode() {
  local name="$1"
  ffmpeg -y -v error -i "$MASTER/$name.wav" -ar 44100 -ac 2 -codec:a libmp3lame -b:a 128k "$OUT/$name.mp3"
}

loop_mix() {
  local name="$1" target="$2" pitch="$3" ambience="$4" kalimba="$5" drum="$6" chimes="$7"
  ffmpeg -y -v error \
    -stream_loop -1 -i "$SRC/forest-ambience-687054.mp3" \
    -stream_loop -1 -i "$SRC/kalimba-c-note-331047.mp3" \
    -stream_loop -1 -i "$SRC/frame-drum-345629.mp3" \
    -stream_loop -1 -i "$SRC/wind-chimes-424250.mp3" \
    -filter_complex "[0:a]atrim=0:14,volume=$ambience,highpass=f=70,lowpass=f=9000[a];[1:a]asetrate=44100*$pitch,aresample=44100,volume=$kalimba,adelay=500|500[k];[2:a]volume=$drum,adelay=1500|1500[d];[3:a]volume=$chimes,adelay=2600|2600[c];[a][k][d][c]amix=inputs=4:duration=longest:normalize=0,atrim=0:14,loudnorm=I=$target:TP=-1.5:LRA=8,asplit=3[h][m][t];[h]atrim=0:2,asetpts=PTS-STARTPTS[head];[m]atrim=2:12,asetpts=PTS-STARTPTS[mid];[t]atrim=12:14,asetpts=PTS-STARTPTS[tail];[tail][head]acrossfade=d=2:c1=qsin:c2=qsin[seam];[mid][seam]concat=n=2:v=0:a=1[out]" \
    -map "[out]" -t 12 -ar 44100 -ac 2 -codec:a pcm_s24le "$MASTER/$name.wav"
  encode "$name"
}

effect() {
  local name="$1" source="$2" duration="$3" target="$4" processing="$5"
  ffmpeg -y -v error -i "$SRC/$source" -filter_complex "[0:a]atrim=0:$duration,asetpts=PTS-STARTPTS,$processing,loudnorm=I=$target:TP=-1.5:LRA=7,afade=t=out:st=$(awk "BEGIN { print ($duration > 0.25 ? $duration - 0.12 : $duration * 0.7) }"):d=0.12,alimiter=limit=0.89:attack=5:release=50,volume=0.75[out]" -map "[out]" -t "$duration" -ar 44100 -ac 2 -codec:a pcm_s24le "$MASTER/$name.wav"
  encode "$name"
}

effect_mix() {
  local name="$1" source_a="$2" source_b="$3" duration="$4" target="$5" delay="$6"
  ffmpeg -y -v error -i "$SRC/$source_a" -i "$SRC/$source_b" -filter_complex "[0:a]atrim=0:$duration,asetpts=PTS-STARTPTS,volume=0.85[a];[1:a]atrim=0:$duration,asetpts=PTS-STARTPTS,adelay=$delay|$delay,volume=0.7[b];[a][b]amix=inputs=2:duration=longest:normalize=0,atrim=0:$duration,loudnorm=I=$target:TP=-1.5:LRA=7,afade=t=out:st=$(awk "BEGIN { print ($duration > 0.25 ? $duration - 0.12 : $duration * 0.7) }"):d=0.12,alimiter=limit=0.89:attack=5:release=50,volume=0.75[out]" -map "[out]" -t "$duration" -ar 44100 -ac 2 -codec:a pcm_s24le "$MASTER/$name.wav"
  encode "$name"
}

loop_mix ambience-exterior -20 1.00 0.78 0.04 0.00 0.02
loop_mix ambience-interior -20 0.84 0.38 0.08 0.03 0.08
loop_mix music-exploration -16 1.00 0.28 0.42 0.08 0.08
loop_mix music-mystery -16 0.84 0.22 0.32 0.04 0.18
loop_mix music-danger -16 0.75 0.14 0.18 0.34 0.05
loop_mix music-mastery -16 1.26 0.18 0.42 0.22 0.16
loop_mix music-boss -16 0.67 0.10 0.14 0.52 0.05
loop_mix music-victory -16 1.50 0.16 0.48 0.12 0.32
loop_mix music-extraction -16 1.12 0.30 0.36 0.06 0.24
loop_mix music-memorial -16 0.56 0.20 0.18 0.18 0.08
loop_mix motif-grove -18 1.00 0.10 0.48 0.03 0.08
loop_mix motif-spark -18 1.50 0.04 0.44 0.02 0.30
loop_mix motif-tide -18 0.75 0.20 0.32 0.02 0.14
loop_mix motif-stone -18 0.56 0.06 0.12 0.42 0.02

effect movement-leaves leaves-rustling-191454.mp3 0.70 -18 "highpass=f=180,lowpass=f=9500,volume=0.9"
effect root-surge wood-impact-269717.mp3 1.20 -18 "lowpass=f=6000,volume=1.0"
effect leaf-rustle leaves-rustling-191454.mp3 1.40 -20 "highpass=f=300,volume=0.7"
effect wood-break wood-impact-269717.mp3 1.35 -18 "asetrate=44100*0.82,aresample=44100"
effect stone-strike stone-hit-431019.mp3 0.35 -18 "highpass=f=90,volume=0.95"
effect water-cast water-splash-381243.mp3 0.72 -18 "highpass=f=120,volume=0.9"
effect energy-cast wind-chimes-424250.mp3 1.45 -18 "asetrate=44100*1.35,aresample=44100,highpass=f=500"
effect mechanism-turn wood-impact-269717.mp3 1.20 -18 "asetrate=44100*0.72,aresample=44100,lowpass=f=4200"
effect ability-grove kalimba-c-note-331047.mp3 1.60 -18 "asetrate=44100*0.94,aresample=44100"
effect ability-spark wind-chimes-424250.mp3 1.25 -18 "asetrate=44100*1.55,aresample=44100,highpass=f=650"
effect ability-tide water-splash-381243.mp3 0.72 -18 "asetrate=44100*0.82,aresample=44100"
effect ability-stone stone-hit-431019.mp3 0.35 -18 "asetrate=44100*0.68,aresample=44100"
effect_mix guard-impact wood-impact-269717.mp3 stone-hit-431019.mp3 1.20 -18 70
effect dodge-rush leaves-rustling-191454.mp3 0.62 -18 "atempo=1.7,highpass=f=450"
effect switch-card wind-chimes-424250.mp3 0.55 -20 "asetrate=44100*1.8,aresample=44100,highpass=f=900"
effect_mix heavy-impact frame-drum-345629.mp3 wood-impact-269717.mp3 1.45 -18 45
effect injury-hit stone-hit-431019.mp3 0.35 -18 "asetrate=44100*0.58,aresample=44100,lowpass=f=3600"
effect reward-awaken kalimba-c-note-331047.mp3 1.90 -18 "asetrate=44100*1.25,aresample=44100"
effect extraction-open wind-chimes-424250.mp3 2.10 -18 "asetrate=44100*0.92,aresample=44100"
effect_mix death-seal frame-drum-345629.mp3 wood-impact-269717.mp3 2.20 -18 320
effect ui-confirm kalimba-c-note-331047.mp3 0.38 -22 "asetrate=44100*1.75,aresample=44100,highpass=f=450"
effect ui-cancel wood-impact-269717.mp3 0.32 -22 "asetrate=44100*1.35,aresample=44100,lowpass=f=5000"
effect ui-error stone-hit-431019.mp3 0.32 -20 "asetrate=44100*0.72,aresample=44100"
effect_mix boss-telegraph frame-drum-345629.mp3 wind-chimes-424250.mp3 2.10 -18 420

echo "Built Hearttree audio masters and runtime files."
