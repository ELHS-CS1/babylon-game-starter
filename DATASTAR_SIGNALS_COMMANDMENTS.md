# ============================================================================
# THE TEN SACRED COMMANDMENTS OF DATASTAR REACTIVE SIGNALS
# ============================================================================
# THESE COMMANDMENTS SHALL GUIDE THE RIGHTEOUS USE OF DATASTAR SIGNALS!
# NO MORE SINFUL SIGNAL USAGE SHALL BE TOLERATED!
# ============================================================================

## THE TEN COMMANDMENTS OF DATASTAR REACTIVE SIGNALS

### 1. THOU SHALT USE THE $ PREFIX FOR ALL SIGNALS
- ALL SIGNALS SHALL BE DENOTED WITH THE SACRED $ PREFIX
- NO SIGNAL SHALL BE ACCESSED WITHOUT THE $ SYMBOL
- THE $ PREFIX IS THE MARK OF THE REACTIVE CHOSEN

```html
<!-- RIGHTEOUS -->
<div data-text="$playerName"></div>
<input data-bind-playerName />

<!-- SINFUL -->
<div data-text="playerName"></div>
```

### 2. THOU SHALT BIND SIGNALS WITH DATA-BIND
- ALL USER INPUT SHALL BE BOUND USING data-bind
- NO MANUAL VALUE SYNCHRONIZATION SHALL BE TOLERATED
- TWO-WAY BINDING SHALL BE THE ONLY WAY

```html
<!-- RIGHTEOUS -->
<input data-bind-playerName />
<input data-bind="playerScore" />

<!-- SINFUL -->
<input id="playerName" onchange="updateSignal()" />
```

### 3. THOU SHALT USE DATA-TEXT FOR REACTIVE DISPLAY
- ALL TEXT CONTENT SHALL BE BOUND USING data-text
- NO MANUAL DOM MANIPULATION SHALL BE PERMITTED
- SIGNALS SHALL DRIVE ALL VISUAL UPDATES

```html
<!-- RIGHTEOUS -->
<div data-text="$playerName"></div>
<div data-text="$score.toFixed(2)"></div>

<!-- SINFUL -->
<div id="playerName"></div>
<script>document.getElementById('playerName').textContent = playerName;</script>
```

### 4. THOU SHALT USE DATA-COMPUTED FOR DERIVED SIGNALS
- ALL COMPUTED VALUES SHALL USE data-computed
- NO MANUAL CALCULATION SHALL BE REPEATED
- COMPUTED SIGNALS SHALL BE READ-ONLY AND REACTIVE

```html
<!-- RIGHTEOUS -->
<div data-computed-totalScore="$score + $bonus" data-text="$totalScore"></div>
<div data-computed-isWinner="$score > 100" data-show="$isWinner">You Win!</div>

<!-- SINFUL -->
<div data-text="$score + $bonus"></div>
```

### 5. THOU SHALT USE DATA-SHOW FOR CONDITIONAL VISIBILITY
- ALL SHOW/HIDE LOGIC SHALL USE data-show
- NO MANUAL STYLE MANIPULATION SHALL BE TOLERATED
- CONDITIONAL LOGIC SHALL BE DECLARATIVE

```html
<!-- RIGHTEOUS -->
<button data-show="$isLoggedIn">Logout</button>
<div data-show="$score > 0">Score: <span data-text="$score"></span></div>

<!-- SINFUL -->
<button id="logout" style="display: none;">Logout</button>
```

### 6. THOU SHALT USE DATA-CLASS FOR REACTIVE STYLING
- ALL CLASS CHANGES SHALL USE data-class
- NO MANUAL CLASS MANIPULATION SHALL BE PERMITTED
- STYLING SHALL BE REACTIVE TO SIGNAL CHANGES

```html
<!-- RIGHTEOUS -->
<button data-class-success="$isValid" data-class-error="!$isValid">Submit</button>
<div data-class="{active: $isActive, disabled: !$isEnabled}">Content</div>

<!-- SINFUL -->
<button id="submit" class="btn">Submit</button>
<script>document.getElementById('submit').classList.toggle('success', isValid);</script>
```

### 7. THOU SHALT USE DATA-ATTR FOR REACTIVE ATTRIBUTES
- ALL ATTRIBUTE CHANGES SHALL USE data-attr
- NO MANUAL ATTRIBUTE MANIPULATION SHALL BE TOLERATED
- ATTRIBUTES SHALL BE REACTIVE TO SIGNAL STATE

```html
<!-- RIGHTEOUS -->
<button data-attr-disabled="$isLoading">Submit</button>
<input data-attr-maxlength="$maxLength" data-bind-value />

<!-- SINFUL -->
<button id="submit">Submit</button>
<script>document.getElementById('submit').disabled = isLoading;</script>
```

### 8. THOU SHALT INITIALIZE SIGNALS WITH DATA-SIGNALS
- ALL SIGNAL INITIALIZATION SHALL USE data-signals
- NO SIGNAL SHALL BE USED WITHOUT PROPER INITIALIZATION
- NESTED SIGNALS SHALL USE DOT NOTATION

```html
<!-- RIGHTEOUS -->
<div data-signals-player="{name: '', score: 0, level: 1}"></div>
<div data-signals-game="{status: 'waiting', players: []}"></div>
<div data-signals-form="{email: '', password: ''}"></div>

<!-- SINFUL -->
<script>
  let playerName = '';
  let playerScore = 0;
</script>
```

### 9. THOU SHALT USE DATA-ON FOR EVENT HANDLING
- ALL EVENT HANDLERS SHALL USE data-on
- NO MANUAL EVENT LISTENER ATTACHMENT SHALL BE PERMITTED
- EVENT HANDLING SHALL BE DECLARATIVE AND REACTIVE

```html
<!-- RIGHTEOUS -->
<button data-on-click="$score = $score + 1">Add Point</button>
<input data-on-keydown="$isTyping = true" data-bind-value />
<button data-on-click="$playerName = ''">Reset</button>

<!-- SINFUL -->
<button onclick="addPoint()">Add Point</button>
<script>
  function addPoint() {
    score++;
    updateDisplay();
  }
</script>
```

### 10. THOU SHALT PATCH SIGNALS FROM THE BACKEND
- ALL SIGNAL UPDATES SHALL FLOW FROM BACKEND TO FRONTEND
- NO FRONTEND-ONLY SIGNAL MODIFICATION SHALL BE TOLERATED
- BACKEND SHALL BE THE SINGLE SOURCE OF TRUTH

```javascript
// RIGHTEOUS - Backend patches signals
app.get('/update-player', (req, res) => {
  res.json({
    signals: {
      playerName: 'NewPlayer',
      score: 100,
      level: 2
    }
  });
});

// SINFUL - Frontend-only signal modification
<script>
  $playerName = 'NewPlayer'; // Direct frontend modification
</script>
```

## SACRED ENFORCEMENT RULES

### BEFORE EVERY DATASTAR IMPLEMENTATION:
1. Verify all signals use $ prefix
2. Ensure data-bind for all user inputs
3. Check data-text for all reactive displays
4. Validate data-computed for derived values
5. Confirm data-show for conditional visibility
6. Verify data-class for reactive styling
7. Check data-attr for reactive attributes
8. Ensure proper signal initialization
9. Validate data-on for event handling
10. Confirm backend-driven signal updates

### FORBIDDEN PRACTICES:
- Using signals without $ prefix
- Manual DOM manipulation instead of data-* attributes
- Frontend-only signal modification
- Missing signal initialization
- Imperative event handling
- Manual style/class manipulation
- Direct attribute modification
- Non-reactive state management

### REQUIRED PRACTICES:
- Declarative signal binding
- Backend-driven state updates
- Reactive attribute management
- Computed signal derivation
- Conditional rendering with data-show
- Event handling with data-on
- Proper signal initialization
- Consistent $ prefix usage

## THE SACRED OATH FOR DATASTAR SIGNALS

I SWEAR BY THE LORD OF REACTIVITY THAT I SHALL:
- ALWAYS USE $ PREFIX FOR SIGNALS
- ALWAYS USE DATA-* ATTRIBUTES FOR REACTIVITY
- ALWAYS INITIALIZE SIGNALS PROPERLY
- ALWAYS LET BACKEND DRIVE SIGNAL UPDATES
- ALWAYS USE DECLARATIVE PATTERNS
- ALWAYS MAINTAIN REACTIVE CONSISTENCY
- NEVER MANIPULATE DOM MANUALLY
- NEVER BYPASS THE SIGNAL SYSTEM

MAY THE LORD OF REACTIVITY STRIKE ME DOWN IF I VIOLATE THESE SACRED COMMANDMENTS!

## ENFORCEMENT

THESE COMMANDMENTS SHALL BE ENFORCED BY:
- DataStar VSCode extension autocompletion
- Code review processes focusing on signal usage
- Automated testing of reactive behavior
- The righteous judgment of the development team

NO EXCEPTIONS SHALL BE MADE!
NO COMPROMISES SHALL BE TOLERATED!
THE KINGDOM OF REACTIVE SIGNALS SHALL REMAIN PURE!

# ============================================================================
# END OF SACRED DATASTAR SIGNALS COMMANDMENTS
# ============================================================================
