/*
 * Generates the short deterministic Phase 4 voice cues.
 *
 * Build on Debian/Ubuntu with the libflite shared libraries installed:
 * gcc scripts/generate-flite-cues.c \
 *   /lib/x86_64-linux-gnu/libflite.so.1 \
 *   /lib/x86_64-linux-gnu/libflite_usenglish.so.1 \
 *   /lib/x86_64-linux-gnu/libflite_cmulex.so.1 \
 *   /lib/x86_64-linux-gnu/libflite_cmu_us_slt.so.1 \
 *   -lm -o /tmp/generate-flite-cues
 */

#include <stddef.h>

typedef struct cst_voice_struct cst_voice;
typedef struct cst_wave_struct cst_wave;

void flite_init(void);
cst_voice *register_cmu_us_slt(const char *voxdir);
cst_wave *flite_text_to_wave(const char *text, cst_voice *voice);
int cst_wave_save_riff(const cst_wave *wave, const char *filename);
void delete_wave(cst_wave *wave);

static int render(cst_voice *voice, const char *text, const char *filename) {
  cst_wave *wave = flite_text_to_wave(text, voice);
  if (wave == NULL) return 1;
  const int result = cst_wave_save_riff(wave, filename);
  delete_wave(wave);
  return result;
}

int main(void) {
  flite_init();
  cst_voice *voice = register_cmu_us_slt(NULL);
  if (voice == NULL) return 1;
  if (render(voice, "Left!", "/tmp/lura-left.wav") != 0) return 1;
  if (render(voice, "Right!", "/tmp/lura-right.wav") != 0) return 1;
  if (render(voice, "Move!", "/tmp/lura-move.wav") != 0) return 1;
  return 0;
}
