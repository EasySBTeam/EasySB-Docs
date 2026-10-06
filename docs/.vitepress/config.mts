import { defineConfig } from "vitepress";
import { teekConfig } from "./teekConfig";

const zhDescription =
  "EasySB 是一个面向 Linux VPS 的一体化 sing-box 面板：把五个协议、证书签发、解锁检测与订阅生成收进一个交互式菜单，内核直接编译进二进制。";
const enDescription =
  "EasySB is an all-in-one sing-box panel for Linux VPS: five protocols, certificate issuance, unlock checks and subscription generation in one interactive menu, with the core compiled into the binary.";

const zhSidebar = {
  "/guide/": [
    {
      text: "开始",
      items: [
        { text: "简介", link: "/guide/intro" },
        { text: "快速开始", link: "/guide/quickstart" },
        { text: "系统要求", link: "/guide/requirements" },
        { text: "安装", link: "/guide/install" },
        { text: "卸载", link: "/guide/uninstall" },
      ],
    },
  ],
  "/features/": [
    {
      text: "功能",
      items: [
        { text: "支持的协议", link: "/features/protocols" },
        { text: "订阅", link: "/features/subscription" },
        { text: "证书", link: "/features/certificates" },
        { text: "防火墙与端口跳跃", link: "/features/firewall" },
        { text: "工具箱", link: "/features/toolbox" },
      ],
    },
  ],
  "/config/": [
    {
      text: "配置",
      items: [
        { text: "配置模板", link: "/config/templates" },
        { text: "账号与流量", link: "/config/users" },
        { text: "内核构建", link: "/config/core-builds" },
        { text: "运行时路径", link: "/config/paths" },
      ],
    },
  ],
  "/dev/": [
    {
      text: "开发者",
      items: [
        { text: "架构", link: "/dev/architecture" },
        { text: "设计", link: "/dev/design" },
        { text: "约定", link: "/dev/conventions" },
        { text: "踩坑", link: "/dev/pitfalls" },
        { text: "构建与测试", link: "/dev/build" },
      ],
    },
  ],
  "/": [
    {
      text: "帮助",
      items: [
        { text: "常见问题", link: "/faq" },
        { text: "更新日志", link: "/changelog" },
      ],
    },
  ],
};

const enSidebar = {
  "/en/guide/": [
    {
      text: "Getting Started",
      items: [
        { text: "Introduction", link: "/en/guide/intro" },
        { text: "Quick Start", link: "/en/guide/quickstart" },
        { text: "Requirements", link: "/en/guide/requirements" },
        { text: "Install", link: "/en/guide/install" },
        { text: "Uninstall", link: "/en/guide/uninstall" },
      ],
    },
  ],
  "/en/features/": [
    {
      text: "Features",
      items: [
        { text: "Supported Protocols", link: "/en/features/protocols" },
        { text: "Subscription", link: "/en/features/subscription" },
        { text: "Certificates", link: "/en/features/certificates" },
        { text: "Firewall and Port Hopping", link: "/en/features/firewall" },
        { text: "Toolbox", link: "/en/features/toolbox" },
      ],
    },
  ],
  "/en/config/": [
    {
      text: "Configuration",
      items: [
        { text: "Config Templates", link: "/en/config/templates" },
        { text: "Accounts and Usage", link: "/en/config/users" },
        { text: "Core Build", link: "/en/config/core-builds" },
        { text: "Runtime Paths", link: "/en/config/paths" },
      ],
    },
  ],
  "/en/dev/": [
    {
      text: "Developers",
      items: [
        { text: "Architecture", link: "/en/dev/architecture" },
        { text: "Design", link: "/en/dev/design" },
        { text: "Conventions", link: "/en/dev/conventions" },
        { text: "Pitfalls", link: "/en/dev/pitfalls" },
        { text: "Build and Test", link: "/en/dev/build" },
      ],
    },
  ],
  "/en/": [
    {
      text: "Help",
      items: [
        { text: "FAQ", link: "/en/faq" },
        { text: "Changelog", link: "/en/changelog" },
      ],
    },
  ],
};

export default defineConfig({
  extends: teekConfig,
  title: "EasySB",
  description: zhDescription,
  lang: "zh-CN",
  cleanUrls: false,
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "EasySB" }],
    ["meta", { property: "og:title", content: "EasySB 文档" }],
    ["meta", { property: "og:description", content: zhDescription }],
    ["meta", { property: "og:url", content: "https://docs.kejizero.xyz/" }],
    ["meta", { name: "author", content: "MinimaxFlora" }],
  ],
  markdown: {
    lineNumbers: true,
    image: { lazyLoading: true },
  },
  sitemap: {
    hostname: "https://docs.kejizero.xyz",
  },
  themeConfig: {
    logo: "/logo.svg",
    socialLinks: [{ icon: "github", link: "https://github.com/EasySBTeam/EasySB" }],
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: "搜索文档", buttonAriaLabel: "搜索文档" },
              modal: {
                displayDetails: "显示详情",
                resetButtonTitle: "清除查询",
                noResultsText: "未找到结果",
                footer: {
                  selectText: "选择",
                  navigateText: "切换",
                  closeText: "关闭",
                },
              },
            },
          },
          en: {
            translations: {
              button: { buttonText: "Search", buttonAriaLabel: "Search" },
              modal: {
                displayDetails: "Display details",
                resetButtonTitle: "Reset search",
                noResultsText: "No results for",
                footer: {
                  selectText: "to select",
                  navigateText: "to navigate",
                  closeText: "to close",
                },
              },
            },
          },
        },
      },
    },
    outline: { level: [2, 3], label: "本页导航" },
    docFooter: { prev: "上一页", next: "下一页" },
    lastUpdatedText: "最后更新",
    darkModeSwitchLabel: "外观",
    sidebarMenuLabel: "目录",
    returnToTopLabel: "回到顶部",
    editLink: {
      pattern: "https://github.com/EasySBTeam/EasySB-Docs/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },
    footer: {
      message: "基于 GPL-3.0 许可发布",
      copyright: "Copyright © 2026 EasySB",
    },
  },
  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN",
      title: "EasySB 文档",
      description: zhDescription,
      head: [["meta", { property: "og:locale", content: "zh_CN" }]],
      themeConfig: {
        nav: [
          { text: "首页", link: "/" },
          { text: "指南", link: "/guide/intro", activeMatch: "/guide/" },
          { text: "功能", link: "/features/protocols", activeMatch: "/features/" },
          { text: "配置", link: "/config/templates", activeMatch: "/config/" },
          { text: "开发者", link: "/dev/architecture", activeMatch: "/dev/" },
          {
            text: "更多",
            items: [
              { text: "常见问题", link: "/faq" },
              { text: "更新日志", link: "/changelog" },
              {
                text: "安装包下载",
                link: "https://github.com/EasySBTeam/EasySB/releases",
              },
            ],
          },
        ],
        sidebar: zhSidebar,
        editLink: {
          pattern: "https://github.com/EasySBTeam/EasySB-Docs/edit/main/docs/:path",
          text: "在 GitHub 上编辑此页",
        },
      },
    },
    en: {
      label: "English",
      lang: "en",
      link: "/en/",
      title: "EasySB Docs",
      description: enDescription,
      head: [["meta", { property: "og:locale", content: "en_US" }]],
      themeConfig: {
        nav: [
          { text: "Home", link: "/en/" },
          { text: "Guide", link: "/en/guide/intro", activeMatch: "/en/guide/" },
          {
            text: "Features",
            link: "/en/features/protocols",
            activeMatch: "/en/features/",
          },
          {
            text: "Configuration",
            link: "/en/config/templates",
            activeMatch: "/en/config/",
          },
          {
            text: "Developers",
            link: "/en/dev/architecture",
            activeMatch: "/en/dev/",
          },
          {
            text: "More",
            items: [
              { text: "FAQ", link: "/en/faq" },
              { text: "Changelog", link: "/en/changelog" },
              {
                text: "Download packages",
                link: "https://github.com/EasySBTeam/EasySB/releases",
              },
            ],
          },
        ],
        sidebar: enSidebar,
        outline: { level: [2, 3], label: "On this page" },
        docFooter: { prev: "Previous", next: "Next" },
        lastUpdatedText: "Last updated",
        darkModeSwitchLabel: "Appearance",
        sidebarMenuLabel: "Menu",
        returnToTopLabel: "Return to top",
        editLink: {
          pattern: "https://github.com/EasySBTeam/EasySB-Docs/edit/main/docs/:path",
          text: "Edit this page on GitHub",
        },
        footer: {
          message: "Released under the GPL-3.0 license",
          copyright: "Copyright © 2026 EasySB",
        },
      },
    },
  },
});
