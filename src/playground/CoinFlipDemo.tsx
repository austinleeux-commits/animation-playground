import { useDialKit } from 'dialkit'
import { Card } from './Card'
import { CoinFlipDisc } from './icons/CoinFlipDisc'
import { buildCoinFlipLottie, coinFlipEase, coinFlipSeconds } from './lottie/buildCoinFlipLottie'
import { downloadLottieFile } from './lottie/lottie'

export function CoinFlipDemo() {
  const p = useDialKit(
    'Coin Flip',
    {
      /* The recording this is traced from sweeps linearly — the terminator
       * crosses the disc at a constant rate rather than easing in and out. */
      flipMotion: { type: 'easing', duration: 0.8, ease: [0, 0, 1, 1] },
      holdsEachFace: [0.2, 0, 1.5, 0.05],
      newFaceEntersFrom: { type: 'select', options: ['Left', 'Right'], default: 'Left' },
      frontFaceColor: { type: 'color', default: '#D2D2D2' },
      backFaceColor: { type: 'color', default: '#121212' },
      exportLottie: { type: 'action' },
    },
    {
      onAction: (path) => {
        if (path !== 'exportLottie') return
        downloadLottieFile(
          buildCoinFlipLottie({
            transition: p.flipMotion,
            holdSeconds: p.holdsEachFace,
            entrySide: p.newFaceEntersFrom === 'Right' ? -1 : 1,
            frontColor: p.frontFaceColor,
            backColor: p.backFaceColor,
          }),
          'coin-flip.json',
        )
      },
    },
  )

  return (
    <Card
      title="Coin Flip"
      description="A two-tone disc turning on its vertical axis — the incoming face sweeps across on an elliptical edge, so the silhouette stays a perfect circle. Tune the turn, the rest between turns, and the two faces, then export as a Lottie file."
    >
      <CoinFlipDisc
        size={160}
        frontColor={p.frontFaceColor}
        backColor={p.backFaceColor}
        entrySide={p.newFaceEntersFrom === 'Right' ? -1 : 1}
        flipSeconds={coinFlipSeconds(p.flipMotion)}
        holdSeconds={p.holdsEachFace}
        ease={coinFlipEase(p.flipMotion)}
      />
    </Card>
  )
}
