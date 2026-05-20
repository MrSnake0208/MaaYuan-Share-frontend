export interface AdBannerConfigItem {
  image: string;
  link: string;
  alt?: string;
}

// 可在此数组中快速增删改广告项
export const defaultAdBanners: AdBannerConfigItem[] = [
  // {
  //   image: '/ad_leidian.webp',
  //   link: 'https://lddl01.ldmnq.com/downloader/ldplayerinst9.exe?n=LDplayer9_ld_406237_3586_ld.exe',
  //   alt: '雷电模拟器',
  // },
  {
    image: "/麻圆MuMu合作-560x320.jpg",
    link: "https://adl.netease.com/d/g/a11/c/maayuan",
    alt: "MuMu",
  },
  {
    image: "/biubiu.png",
    link: "https://www.biubiu001.com/?cfrom=maayuan",
    alt: "biubiu",
  },
  {
    image: "/mirror.png",
    link: "https://mirrorchyan.com/zh/projects?rid=MaaYuan&source=navtop",
    alt: "Mirror",
  },
  {
    image: "/辟雍.png",
    link: "",
    alt: "辟雍",
  },
  {
    image: "/wiki.png",
    link: "https://wiki.biligame.com/yuan/%E9%A6%96%E9%A1%B5",
    alt: "wiki",
  },
];
