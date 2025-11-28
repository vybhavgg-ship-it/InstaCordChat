# Design Guidelines: Multi-Platform Chat Application

## Design Approach
**Reference-Based Approach**: Drawing from Instagram's clean, photo-centric aesthetic combined with Discord's efficient server/channel navigation patterns.

**Primary References**:
- Instagram: Message threading, story-like status updates, clean profile cards, bottom tab navigation (mobile)
- Discord: Left sidebar server/channel organization, member lists, rich presence system
- Telegram: Message bubble design, smooth animations for new messages

## Core Design Principles
1. **Visual Hierarchy**: Conversations take center stage with minimal chrome
2. **Instant Clarity**: User status, message states, and navigation immediately obvious
3. **Fluid Navigation**: Seamless switching between DMs, group chats, and channels

## Layout System

### Desktop Layout (Three-Column)
- **Left Sidebar (280px)**: Server/channel navigation, profile switcher at top
- **Middle Panel (320px)**: Conversation list with search, recent chats, friend requests
- **Main Content (Fluid)**: Active chat thread with header showing participants/channel info
- **Right Panel (240px, collapsible)**: Member list, channel details, shared media

### Mobile Layout (Single Column)
- Bottom tab navigation: Chats, Explore, Notifications, Profile
- Swipe gestures for quick actions (archive, delete, mute)
- Full-screen chat view when conversation open

### Spacing System
Use Tailwind units: **2, 3, 4, 6, 8, 12** for consistent rhythm
- Component padding: p-4 (standard), p-6 (generous sections)
- Section spacing: space-y-3 (tight lists), space-y-6 (separated content)
- Container padding: px-4 (mobile), px-6 (tablet), px-8 (desktop)

## Typography

**Font Stack**: Inter (primary), SF Pro Display (fallback)
- **App Title/Headers**: text-2xl font-bold
- **Chat Names**: text-base font-semibold
- **Message Text**: text-sm font-normal (body), text-xs (timestamps/meta)
- **Usernames**: text-sm font-medium
- **Status/Labels**: text-xs font-medium uppercase tracking-wide

## Component Library

### Navigation & Structure
**Server/Channel Sidebar**:
- Circular server icons (48px) with notification badges
- Nested channel lists with # prefix, indented 12px
- Active channel: subtle background highlight
- Hover states: slight background tint

**Conversation List Item**:
- Avatar (52px) with online indicator (8px green dot, bottom-right)
- Name + last message preview (truncate at 2 lines)
- Timestamp (top-right), unread badge (bottom-right)
- Compact spacing: py-3 px-4

### Chat Interface
**Message Bubbles**:
- Own messages: rounded-2xl, align-right, max-width 65%
- Others' messages: rounded-2xl, align-left with avatar (32px)
- Group consecutive messages from same user (collapse avatar/name)
- Reactions: floating pill badges below bubble, -mt-2

**Message Input**:
- Fixed bottom bar with rounded-3xl input field
- Left icons: attach media, emoji picker
- Right: send button (icon only, accent color)
- Height: min-h-[56px] with auto-expand for multiline

**Typing Indicators**:
- Small animated dots below last message
- "[Username] is typing..." in subtle text-xs

### User Presence
**Profile Cards**:
- Large avatar (96px) with status ring
- Username (text-lg font-bold) + @handle (text-sm muted)
- Bio (text-sm, max 2 lines)
- Status message with emoji prefix
- Quick actions: Message, Call, More

**Status Indicators**:
- Online: green ring (3px) around avatar
- Away: yellow ring
- Do Not Disturb: red ring with slash
- Offline: gray ring

### Rich Features
**Media Previews**:
- Images: rounded-lg, max 400px width, click to expand
- Videos: play button overlay, duration badge
- Links: card preview with thumbnail, title, description

**Channel Headers**:
- Channel name (text-lg font-semibold) with # prefix
- Member count, topic/description (truncated)
- Right actions: search, call, settings

**Search Interface**:
- Full-width at top of conversation list
- Rounded-full input with magnifying glass icon
- Filter pills below: All, Messages, People, Media

## Mobile-Specific Patterns
- **Bottom Sheet**: For reactions, message options, user profiles
- **Swipe Actions**: Left swipe reveals archive/delete, right swipe quick reply
- **Pull to Refresh**: Standard gesture for loading new messages
- **Floating Action Button**: Bottom-right for new message (when in chat list)

## Images
No large hero images required. Focus on user-generated content:
- Profile avatars throughout (user photos)
- Message media (photos, videos sent by users)
- Server/channel icons (custom or generated)
- Empty states: friendly illustrations for "No messages yet", "Start chatting"

## Accessibility
- High contrast text ratios on all backgrounds
- Keyboard navigation: Tab through conversations, Enter to open
- Screen reader labels for all icons and actions
- Focus indicators on all interactive elements
- Message timestamps always visible for context

## Interactions (Minimal)
- **Message Send**: Subtle fade-in for new messages
- **Typing Indicator**: Gentle pulse animation
- **New Message Badge**: Scale-in effect
- **Pull to Refresh**: Standard spinner
- Avoid complex animations—prioritize instant, snappy interactions