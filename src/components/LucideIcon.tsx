import {
  Utensils,
  Home,
  Car,
  Smile,
  HeartPulse,
  ShoppingBag,
  Sparkles,
  BookOpen,
  Gift,
  Laptop,
  Plane,
  PiggyBank,
  Wallet,
  DollarSign,
  Plus,
  Minus,
  TrendingUp,
  Settings,
  Calendar,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Trash2,
  Edit3,
  Pencil,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  FileText,
  PieChart,
  Info,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  X,
  Coins,
  Calculator,
  User,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  History,
  Check,
  Tv,
  Shirt,
  Gamepad2,
  Heart,
  Wrench,
  Coffee,
  Dumbbell,
  Shield,
  GraduationCap,
  Baby,
  PawPrint,
  Lightbulb,
  Phone,
  // Nowe ikony
  CreditCard,
  Receipt,
  Key,
  Banknote,
  Landmark,
  Percent,
  Briefcase,
  Scale,
  ShoppingBasket,
  Hammer,
  Plug,
  Scissors,
  Store,
  Package,
  Soup,
  Truck,
  Flame,
  Sofa,
  Bath,
  Music,
  Film,
  Camera,
  Palette,
  Beer,
  Wine,
  Dices,
  Trophy,
  Clapperboard,
  Theater,
  Brush,
  Crown,
  PartyPopper,
  Guitar,
  Compass,
  Globe,
  Map,
  Luggage,
  Bike,
  Train,
  Hotel,
  Caravan,
  Ship,
  Footprints,
  MapPin,
  Ticket,
  Tent,
  Anchor,
  Fuel,
  Apple,
  Pill,
  Stethoscope,
  Trees,
  Flower2,
  Users,
  HeartHandshake,
  Brain,
  Salad,
  Crosshair,
  Syringe,
  Bed,
  AlertOctagon,
  Lock,
  Unlock,
  Activity,
  LineChart,
  LayoutDashboard,
  Folder,
  FolderOpen,
  LogOut
} from 'lucide-react';

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = '', size }: LucideIconProps) {
  const iconProps = { className, size };
  
  switch (name.toLowerCase()) {
    case 'utensils':
      return <Utensils {...iconProps} />;
    case 'home':
      return <Home {...iconProps} />;
    case 'car':
      return <Car {...iconProps} />;
    case 'smile':
      return <Smile {...iconProps} />;
    case 'heartpulse':
    case 'heart-pulse':
      return <HeartPulse {...iconProps} />;
    case 'shoppingbag':
    case 'shopping-bag':
      return <ShoppingBag {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'bookopen':
    case 'book-open':
      return <BookOpen {...iconProps} />;
    case 'gift':
      return <Gift {...iconProps} />;
    case 'laptop':
      return <Laptop {...iconProps} />;
    case 'plane':
      return <Plane {...iconProps} />;
    case 'piggybank':
    case 'piggy-bank':
      return <PiggyBank {...iconProps} />;
    case 'wallet':
      return <Wallet {...iconProps} />;
    case 'dollarsign':
    case 'dollar-sign':
      return <DollarSign {...iconProps} />;
    case 'plus':
      return <Plus {...iconProps} />;
    case 'minus':
      return <Minus {...iconProps} />;
    case 'trendingup':
    case 'trending-up':
      return <TrendingUp {...iconProps} />;
    case 'trendingdown':
    case 'trending-down':
      return <TrendingDown {...iconProps} />;
    case 'settings':
      return <Settings {...iconProps} />;
    case 'calendar':
      return <Calendar {...iconProps} />;
    case 'chevronright':
    case 'chevron-right':
      return <ChevronRight {...iconProps} />;
    case 'chevronleft':
    case 'chevron-left':
      return <ChevronLeft {...iconProps} />;
    case 'chevrondown':
    case 'chevron-down':
      return <ChevronDown {...iconProps} />;
    case 'trash2':
    case 'trash-2':
      return <Trash2 {...iconProps} />;
    case 'edit3':
    case 'edit-3':
      return <Edit3 {...iconProps} />;
    case 'pencil':
      return <Pencil {...iconProps} />;
    case 'morevertical':
    case 'more-vertical':
      return <MoreVertical {...iconProps} />;
    case 'checkcircle':
    case 'check-circle':
      return <CheckCircle {...iconProps} />;
    case 'alertcircle':
    case 'alert-circle':
      return <AlertCircle {...iconProps} />;
    case 'rotateccw':
    case 'rotate-ccw':
      return <RotateCcw {...iconProps} />;
    case 'filetext':
    case 'file-text':
      return <FileText {...iconProps} />;
    case 'piechart':
    case 'pie-chart':
      return <PieChart {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
    case 'search':
      return <Search {...iconProps} />;
    case 'arrowright':
    case 'arrow-right':
      return <ArrowRight {...iconProps} />;
    case 'arrowleft':
    case 'arrow-left':
      return <ArrowLeft {...iconProps} />;
    case 'x':
      return <X {...iconProps} />;
    case 'coins':
      return <Coins {...iconProps} />;
    case 'calculator':
      return <Calculator {...iconProps} />;
    case 'user':
      return <User {...iconProps} />;
    case 'arrowdownright':
      return <ArrowDownRight {...iconProps} />;
    case 'arrowupright':
      return <ArrowUpRight {...iconProps} />;
    case 'history':
      return <History {...iconProps} />;
    case 'check':
      return <Check {...iconProps} />;
    case 'tv':
      return <Tv {...iconProps} />;
    case 'shirt':
      return <Shirt {...iconProps} />;
    case 'gamepad2':
      return <Gamepad2 {...iconProps} />;
    case 'heart':
      return <Heart {...iconProps} />;
    case 'wrench':
      return <Wrench {...iconProps} />;
    case 'coffee':
      return <Coffee {...iconProps} />;
    case 'dumbbell':
      return <Dumbbell {...iconProps} />;
    case 'shield':
      return <Shield {...iconProps} />;
    case 'graduationcap':
      return <GraduationCap {...iconProps} />;
    case 'baby':
      return <Baby {...iconProps} />;
    case 'pawprint':
      return <PawPrint {...iconProps} />;
    case 'lightbulb':
      return <Lightbulb {...iconProps} />;
    case 'phone':
      return <Phone {...iconProps} />;
    
    // Nowe ikony
    case 'creditcard':
      return <CreditCard {...iconProps} />;
    case 'receipt':
      return <Receipt {...iconProps} />;
    case 'key':
      return <Key {...iconProps} />;
    case 'banknote':
      return <Banknote {...iconProps} />;
    case 'landmark':
      return <Landmark {...iconProps} />;
    case 'percent':
      return <Percent {...iconProps} />;
    case 'briefcase':
      return <Briefcase {...iconProps} />;
    case 'scale':
      return <Scale {...iconProps} />;
    case 'shoppingbasket':
      return <ShoppingBasket {...iconProps} />;
    case 'hammer':
      return <Hammer {...iconProps} />;
    case 'plug':
      return <Plug {...iconProps} />;
    case 'scissors':
      return <Scissors {...iconProps} />;
    case 'store':
      return <Store {...iconProps} />;
    case 'package':
      return <Package {...iconProps} />;
    case 'soup':
      return <Soup {...iconProps} />;
    case 'truck':
      return <Truck {...iconProps} />;
    case 'flame':
      return <Flame {...iconProps} />;
    case 'sofa':
      return <Sofa {...iconProps} />;
    case 'bath':
      return <Bath {...iconProps} />;
    case 'music':
      return <Music {...iconProps} />;
    case 'film':
      return <Film {...iconProps} />;
    case 'camera':
      return <Camera {...iconProps} />;
    case 'palette':
      return <Palette {...iconProps} />;
    case 'beer':
      return <Beer {...iconProps} />;
    case 'wine':
      return <Wine {...iconProps} />;
    case 'dices':
      return <Dices {...iconProps} />;
    case 'trophy':
      return <Trophy {...iconProps} />;
    case 'clapperboard':
      return <Clapperboard {...iconProps} />;
    case 'theater':
      return <Theater {...iconProps} />;
    case 'brush':
      return <Brush {...iconProps} />;
    case 'crown':
      return <Crown {...iconProps} />;
    case 'partypopper':
      return <PartyPopper {...iconProps} />;
    case 'guitar':
      return <Guitar {...iconProps} />;
    case 'compass':
      return <Compass {...iconProps} />;
    case 'globe':
      return <Globe {...iconProps} />;
    case 'map':
      return <Map {...iconProps} />;
    case 'luggage':
      return <Luggage {...iconProps} />;
    case 'bike':
      return <Bike {...iconProps} />;
    case 'train':
      return <Train {...iconProps} />;
    case 'hotel':
      return <Hotel {...iconProps} />;
    case 'caravan':
      return <Caravan {...iconProps} />;
    case 'ship':
      return <Ship {...iconProps} />;
    case 'footprints':
      return <Footprints {...iconProps} />;
    case 'mappin':
      return <MapPin {...iconProps} />;
    case 'ticket':
      return <Ticket {...iconProps} />;
    case 'tent':
      return <Tent {...iconProps} />;
    case 'anchor':
      return <Anchor {...iconProps} />;
    case 'fuel':
      return <Fuel {...iconProps} />;
    case 'apple':
      return <Apple {...iconProps} />;
    case 'pill':
      return <Pill {...iconProps} />;
    case 'stethoscope':
      return <Stethoscope {...iconProps} />;
    case 'trees':
      return <Trees {...iconProps} />;
    case 'flower2':
      return <Flower2 {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'hearthandshake':
      return <HeartHandshake {...iconProps} />;
    case 'brain':
      return <Brain {...iconProps} />;
    case 'salad':
      return <Salad {...iconProps} />;
    case 'crosshair':
      return <Crosshair {...iconProps} />;
    case 'syringe':
      return <Syringe {...iconProps} />;
    case 'bed':
      return <Bed {...iconProps} />;
    case 'alertoctagon':
      return <AlertOctagon {...iconProps} />;
    case 'lock':
      return <Lock {...iconProps} />;
    case 'unlock':
      return <Unlock {...iconProps} />;
    case 'activity':
      return <Activity {...iconProps} />;
    case 'linechart':
    case 'line-chart':
      return <LineChart {...iconProps} />;
    case 'layoutdashboard':
    case 'layout-dashboard':
      return <LayoutDashboard {...iconProps} />;
    case 'folder':
      return <Folder {...iconProps} />;
    case 'folderopen':
    case 'folder-open':
      return <FolderOpen {...iconProps} />;
    case 'logout':
      return <LogOut {...iconProps} />;
    default:
      // Fallback
      return <Wallet {...iconProps} />;
  }
}
export type { LucideIconProps };
