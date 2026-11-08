export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  disabled?: boolean;
  /** 小节级条目缩进显示 */
  indent?: boolean;
  /** 子级条目：渲染为可折叠的章节树 */
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  /** alt: 次级分组，标签用弱色显示 */
  alt?: boolean;
  /** indent: 子项缩进 */
  indent?: boolean;
  items: NavItem[];
}
