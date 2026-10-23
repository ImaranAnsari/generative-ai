function AssistantIcon() {
  return (
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#cfeae3] shadow-inner shadow-[#b3d8d0]">
      <div className="relative h-8 w-9">
        <div className="absolute left-0 top-1 h-5 w-5 rounded-full border-[2.5px] border-[#2f2f2f] bg-transparent" />
        <div className="absolute right-0 top-1 h-5 w-5 rounded-full border-[2.5px] border-[#2f2f2f] bg-transparent" />
        <div className="absolute left-1/2 top-5 h-2.5 w-5 -translate-x-1/2 rounded-full border-[2.5px] border-[#2f2f2f] border-t-0" />
        <div className="absolute left-1/2 top-1 h-3 w-4 -translate-x-1/2 rounded-[10px] bg-[#d8f0ea]" />
        <div className="absolute left-[8px] top-[6px] h-1.5 w-1.5 rounded-full bg-[#2f2f2f]" />
        <div className="absolute right-[8px] top-[6px] h-1.5 w-1.5 rounded-full bg-[#2f2f2f]" />
      </div>
    </div>
  )
}

function WelcomeScreen() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center justify-center text-center">
        <AssistantIcon />
        <h2 className="text-[22px] font-medium tracking-[-0.03em] text-[var(--title-color)] sm:text-[24px]">
          How can I help you today?
        </h2>
        <p className="mt-2 max-w-[420px] text-[14px] leading-6 text-[var(--muted-color)] sm:text-[15px]">
          Ask me anything and I&apos;ll do my best to help you with detailed
          responses.
        </p>
      </div>
    </div>
  )
}

export default WelcomeScreen
