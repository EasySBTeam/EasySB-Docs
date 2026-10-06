import { defineTeekConfig } from "vitepress-theme-teek/config";

// Teek theme configuration shared by every locale. The site is a documentation site,
// so the VitePress home and doc layout stay on while Teek's blog home and its
// auto-generated sidebar are turned off: each locale declares its own sidebar.
export const teekConfig = defineTeekConfig({
  teekTheme: true,
  teekHome: false,
  vpHome: true,
  sidebarTrigger: true,
  author: { name: "MinimaxFlora", link: "https://github.com/MinimaxFlora" },
  themeEnhance: {
    // Lock the brand look: no layout switch and no colour board for readers.
    layoutSwitch: { disable: true },
    themeColor: { disable: true },
  },
  codeBlock: {
    copiedDone: TkMessage => TkMessage.success("已复制"),
  },
  footerInfo: {
    theme: { name: "EasySB" },
    copyright: { createYear: 2026, suffix: "EasySB" },
  },
  vitePlugins: {
    // Explicit sidebars per locale; the auto sidebar would not know about /en/.
    sidebar: false,
  },
});
