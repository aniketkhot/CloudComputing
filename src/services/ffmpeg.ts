import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// point fluent-ffmpeg at the bundled binary (works on EC2 too)
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export function transcode(
  input: string,
  output: string,
  preset: '720p' | '480p'
): Promise<void> {
  const scale = preset === '720p' ? 'scale=-2:720' : 'scale=-2:480';

  return new Promise<void>((resolve, reject) => {
    const cmd: FfmpegCommand = ffmpeg(input)
      .videoFilters(scale)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset veryfast', '-crf 23'])
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err));

    cmd.save(output);
  });
}
