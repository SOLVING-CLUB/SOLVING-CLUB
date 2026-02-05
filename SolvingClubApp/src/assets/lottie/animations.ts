/**
 * Lottie animations for software agency theme
 * 
 * Login animation: Custom Lottie file from Gemini Pro
 * Signup and Forgot Password: Placeholder animations (replace with actual files)
 */

// Login animation - Custom Lottie file
export const loginAnimation = require('./login.json');

// Placeholder animations - Replace with actual Lottie files
const _loginAnimationPlaceholder = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: 'Developer',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Code',
      sr: 1,
      ks: {
        o: {a: 0, k: 100},
        r: {a: 1, k: [
          {i: {x: [0.667], y: [1]}, o: {x: [0.333], y: [0]}, t: 0, s: [0]},
          {t: 90, s: [360]}
        ]},
        p: {a: 0, k: [100, 100, 0]},
        a: {a: 0, k: [0, 0, 0]},
        s: {a: 0, k: [100, 100, 100]},
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              d: 1,
              ty: 'el',
              s: {a: 0, k: [80, 80]},
              p: {a: 0, k: [0, 0]},
              nm: 'Circle',
            },
            {
              ty: 'st',
              c: {a: 0, k: [0.2, 0.4, 0.8, 1]},
              o: {a: 0, k: 100},
              w: {a: 0, k: 4},
              lc: 1,
              lj: 1,
              ml: 4,
              bm: 0,
              nm: 'Stroke',
            },
          ],
          nm: 'Circle',
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
};

// Simple placeholder animation - Team theme
export const signupAnimation = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: 'Team',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Team',
      sr: 1,
      ks: {
        o: {a: 0, k: 100},
        r: {a: 0, k: 0},
        p: {a: 1, k: [
          {i: {x: 0.667, y: 1}, o: {x: 0.333, y: 0}, t: 0, s: [100, 100, 0]},
          {i: {x: 0.667, y: 1}, o: {x: 0.333, y: 0}, t: 45, s: [100, 80, 0]},
          {t: 90, s: [100, 100, 0]}
        ]},
        a: {a: 0, k: [0, 0, 0]},
        s: {a: 0, k: [100, 100, 100]},
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              d: 1,
              ty: 'el',
              s: {a: 0, k: [60, 60]},
              p: {a: 0, k: [0, 0]},
              nm: 'Circle',
            },
            {
              ty: 'fl',
              c: {a: 0, k: [0.4, 0.6, 0.9, 1]},
              o: {a: 0, k: 100},
              r: 1,
              bm: 0,
              nm: 'Fill',
            },
          ],
          nm: 'Circle',
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
};

// Forgot Password animation - Custom Lottie file
export const forgotPasswordAnimation = require('./forgot-password.json');

// Handshake animation - Using a simple placeholder (can be replaced with actual Lottie file)
export const handshakeAnimation = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: 'Handshake',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Handshake',
      sr: 1,
      ks: {
        o: {a: 0, k: 100},
        r: {a: 1, k: [
          {i: {x: [0.667], y: [1]}, o: {x: [0.333], y: [0]}, t: 0, s: [0]},
          {i: {x: [0.667], y: [1]}, o: {x: [0.333], y: [0]}, t: 45, s: [15]},
          {t: 90, s: [0]}
        ]},
        p: {a: 1, k: [
          {i: {x: 0.667, y: 1}, o: {x: 0.333, y: 0}, t: 0, s: [100, 100, 0]},
          {i: {x: 0.667, y: 1}, o: {x: 0.333, y: 0}, t: 45, s: [100, 90, 0]},
          {t: 90, s: [100, 100, 0]}
        ]},
        a: {a: 0, k: [0, 0, 0]},
        s: {a: 0, k: [100, 100, 100]},
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              d: 1,
              ty: 'el',
              s: {a: 0, k: [80, 80]},
              p: {a: 0, k: [0, 0]},
              nm: 'Circle',
            },
            {
              ty: 'fl',
              c: {a: 0, k: [0.4, 0.6, 0.9, 1]},
              o: {a: 0, k: 100},
              r: 1,
              bm: 0,
              nm: 'Fill',
            },
          ],
          nm: 'Circle',
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
};

