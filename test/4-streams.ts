import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { EncodeUTF8 } from '../src';

const utf8 = suite('EncodeUTF8');
const cases: [string, string[]][] = [
  ['split surrogate pair', ['A\ud83d', '\ude00B']],
  ['empty chunks between surrogate halves', ['A\ud83d', '', '', '\ude00B']],
  ['empty final chunk', ['A\ud83d', '\ude00B', '']],
  ['consecutive split pairs', ['\ud83d', '\ude00\ud834', '\udd1e']],
  ['complete characters', ['Hello ', 'é😀', ' world!']],
  ['final unpaired high surrogate', ['A\ud83d', '']],
  ['high surrogate before ordinary text', ['A\ud83d', 'B']],
  ['unpaired low surrogate', ['A', '\ude00B']],
  ['high surrogate before another pair', ['\ud83d', '\ud83d', '\ude00']]
];

for (const [name, chunks] of cases) {
  utf8(name, () => {
    const output: Uint8Array[] = [];
    const finals: boolean[] = [];
    const encoder = new EncodeUTF8((data, final) => {
      output.push(data);
      finals.push(final);
    });
    chunks.forEach((chunk, i) => encoder.push(chunk, i == chunks.length - 1));

    assert.equal(
      Array.from(Buffer.concat(output)),
      Array.from(new TextEncoder().encode(chunks.join('')))
    );
    assert.equal(finals, chunks.map((_, i) => i == chunks.length - 1));
  });
}

utf8('rejects pushes after the final chunk', () => {
  const encoder = new EncodeUTF8(() => {});
  encoder.push('\ud83d');
  encoder.push('\ude00', true);
  assert.throws(() => encoder.push('more'), /stream finished/);
});

utf8.run();
