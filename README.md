# Poker Pool (Billiard Poker Card)

Mobile app for a poker+billiards hybrid game built with Expo Router + React Native + NativeWind.

## What This App Does

- Supports local game setup for **2 to 8 players**
- Supports offline hotspot/LAN multiplayer flow (host + guests on same local network)
- Runs a **First 3 Cards mini-game** before main Poker Pool starts
- Uses host-authoritative sync model for multiplayer

---

## App Workflow

### 1. Home

From `app/index.tsx`:
- `Host Game` -> `app/host.tsx`
- `Join Game` -> `app/join.tsx`
- `Quick Local Setup` -> `app/setup.tsx`

### 2. Host Flow (Offline Hotspot)

In `app/host.tsx`:
1. Host enters name.
2. Host IP is auto-detected when possible (can be edited manually).
3. Host sets max players (2-8).
4. Host starts session -> lobby opens.

In `app/lobby.tsx`:
1. Room code + host IP shown.
2. Players list updates.
3. Host starts game when at least 2 players are present.

### 3. Join Flow (Offline Hotspot)

In `app/join.tsx`:
1. Guest connects to host hotspot first.
2. Guest enters name, host IP, and room code (or selects discovered host).
3. Guest joins and is synced from host state.

### 4. Game Start: First 3 Cards Mini-Game

In `store/useGameStore.ts`:
1. Each player gets 3 random cards from the shuffled 52-card deck.
2. Players reveal cards.
3. First-3 winner is calculated by hand rank:
   - Three of a Kind
   - Pair
   - High Card
4. Winner of first-3 becomes the **breaker** for Poker Pool.

### 5. Main Poker Pool

After mini-game continue:
1. Remaining 3 cards per player are dealt from the same shuffled deck.
2. Active player pockets balls.
3. If pocketed ball matches card value mapping, matching cards are pocketed.
4. Turn rotates to next player.
5. First player with all 6 cards pocketed wins the round.

### 6. Next Round Break Order

Winner of a round becomes next round breaker.

Example:
- Players: `P1, P2, P3, P4, P5`
- If `P2` wins round:
  - Next round starts with `P2` break
  - Then turn order continues `P3`, `P4`, ...

---

## Multiplayer Sync Model

Networking lives in `services/networking/`:

- `host.ts`:
  - Hosts authoritative game session
  - Broadcasts beacons
  - Accepts guest join/action messages
  - Broadcasts state updates
  - Tracks heartbeat timeouts/disconnects

- `guest.ts`:
  - Scans for host beacons
  - Connects to host via local IP + room code
  - Sends player actions
  - Receives full state updates
  - Detects host disconnect by heartbeat timeout

- `protocol.ts`:
  - Message types
  - LAN IP validation
  - heartbeat constants

Host is source of truth. Guests are read-only mirrors and send only actions.

---

## Tech Stack

- Expo SDK 54
- Expo Router
- React Native
- NativeWind (Tailwind for RN)
- Zustand (game + network state)
- react-native-udp (local transport)
- expo-network (local IP detection)

---

## Run Instructions

1. Install:

```bash
npm install
```

2. Start dev server:

```bash
npx expo start
```

3. For UDP/hotspot networking, use a **development build** (not Expo Go):

```bash
npx expo run:android
# or
npx expo run:ios
```

---

## Key Files

- Routing/screens: `app/`
- Reusable UI: `components/`
- Game constants: `constants/game.ts`
- Game logic/state: `store/useGameStore.ts`
- Networking transport/protocol: `services/networking/`

