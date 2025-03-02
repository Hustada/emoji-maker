import { EmojiGenerator } from '@/components/emoji-generator'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center py-24 px-4">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            😊 Emoji maker
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter text to generate an emoji
          </p>
        </div>
        <EmojiGenerator />
      </div>
    </main>
  )
}
