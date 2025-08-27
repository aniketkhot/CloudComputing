import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export function transcode(input: string, output: string, preset: '720p'|'480p'): Promise<void> {
  const scale = preset === '720p' ? 'scale=-2:720' : 'scale=-2:480';
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .videoFilters(scale)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset veryfast', '-crf 23'])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(output);
  });
}
