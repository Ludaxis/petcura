// Lucide-style line icons, 1.5px stroke
const Icon = ({ children, size = 16, className = "icon", ...rest }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

const IInbox = (p) => (
  <Icon {...p}>
    <path d="M3 12h6l1 2h4l1-2h6" />
    <path d="M3 12V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
    <path d="M3 12v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
  </Icon>
);
const IBell = (p) => (
  <Icon {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
);
const IChart = (p) => (
  <Icon {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-6" />
  </Icon>
);
const ISettings = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icon>
);
const ISearch = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);
const IPlus = (p) => (<Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>);
const IUser = (p) => (<Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>);
const ITag = (p) => (<Icon {...p}><path d="M20 12 12 20l-9-9V3h8z" /><circle cx="7" cy="7" r="1.2" /></Icon>);
const ICheck = (p) => (<Icon {...p}><path d="m4 12 5 5L20 6" /></Icon>);
const IRefresh = (p) => (<Icon {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></Icon>);
const IX = (p) => (<Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>);
const IEdit = (p) => (<Icon {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></Icon>);
const ISend = (p) => (<Icon {...p}><path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></Icon>);
const IPaperclip = (p) => (<Icon {...p}><path d="M21 12 12 21a5.5 5.5 0 0 1-8-8L13 4a3.5 3.5 0 0 1 5 5L9 18a1.5 1.5 0 0 1-2-2l8-8" /></Icon>);
const IClock = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>);
const ITranslate = (p) => (<Icon {...p}><path d="M3 5h12" /><path d="M9 3v2c0 5-2 7-6 8" /><path d="M5 9c0 3 4 6 9 6" /><path d="M14 21l4-9 4 9" /><path d="M16 16h4" /></Icon>);
const IFile = (p) => (<Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></Icon>);
const IArrowL = (p) => (<Icon {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Icon>);
const IPanel = (p) => (<Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" /></Icon>);
const IList = (p) => (<Icon {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Icon>);
const IBoard = (p) => (<Icon {...p}><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="11" rx="1" /></Icon>);
const IFilter = (p) => (<Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z" /></Icon>);
const ISort = (p) => (<Icon {...p}><path d="M11 5h10M11 9h7M11 13h4" /><path d="M3 8V4l3 4M3 16v4l3-4" /></Icon>);
const IMore = (p) => (<Icon {...p}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></Icon>);
const IFlag = (p) => (<Icon {...p}><path d="M4 22V4M4 4h12l-2 4 2 4H4" /></Icon>);
const ISparkle = (p) => (<Icon {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5 9 9M15 15l3.5 3.5M5.5 18.5 9 15M15 9l3.5-3.5" /></Icon>);

Object.assign(window, {
  Icon, IInbox, IBell, IChart, ISettings, ISearch, IPlus, IUser, ITag, ICheck,
  IRefresh, IX, IEdit, ISend, IPaperclip, IClock, ITranslate, IFile, IArrowL,
  IPanel, IList, IBoard, IFilter, ISort, IMore, IFlag, ISparkle
});
