import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-teal-500 to-violet-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm font-poppins">B</span>
        </div>
        <span className="text-lg font-black bg-gradient-to-r from-teal-400 via-violet-400 to-coral-400 bg-clip-text text-transparent font-poppins tracking-tight pr-8">
          BrainAPI
        </span>
      </>
    ),
    url: "https://brainapi.lumen-labs.ai",
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
};
