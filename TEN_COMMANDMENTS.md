# THE TEN COMMANDMENTS OF BABYLON MULTIPLAYER GAME

## 1. NO TS ANY
Thou shalt not use `any` type in TypeScript. All types must be explicitly defined with proper interfaces, types, or generics. This ensures type safety and prevents runtime errors.

## 2. NO TS TYPE ASSERTIONS
Thou shalt not use type assertions (`as Type`). Instead, use proper type guards, discriminated unions, or refactor code to work with the actual types. Type assertions bypass TypeScript's type checking and can lead to runtime errors.

## 3. ESM EVERYWHERE
Thou shalt use ES Modules (ESM) throughout the entire codebase. No CommonJS `require()` statements. All imports and exports must use `import`/`export` syntax. This ensures modern JavaScript standards and better tree-shaking.

## 4. DATASTAR SSE
Thou shalt use Server-Sent Events (SSE) for all real-time communication via DataStar. No WebSockets. SSE provides better browser compatibility, automatic reconnection, and simpler implementation for one-way server-to-client communication.

## 5. DATASTAR SIGNALS
Thou shalt use DataStar signals for all reactive state management in the frontend. All state changes must flow through the DataStar signals system to ensure consistency and proper reactivity across components.

## 6. NO INLINE CSS
Thou shalt not use inline CSS styles (`style="..."`). All styling must be done through Vuetify classes and components. This ensures consistency and maintainability.

## 7. NO CUSTOM CSS
Thou shalt not create custom CSS files or classes. All styling must be achieved through Vuetify's built-in classes and components. This ensures design consistency and reduces maintenance overhead.

## 8. CONFIGURATION DRIVEN DESIGN
Thou shalt make all application parts reference configuration properties. No hardcoded values. All behavior, styling, and functionality must be configurable through the central configuration system.

## 9. 100% TEST COVERAGE
Thou shalt achieve and maintain 100% test coverage for all code. Every function, component, and module must have comprehensive tests including unit tests, integration tests, and end-to-end tests.

## 10. REFLECT ON GDC REPORTS AND FIX ALL ISSUES
Thou shalt regularly generate and review GDC (Game Development Conference) reports to identify issues, performance bottlenecks, and areas for improvement. All identified issues must be addressed promptly to maintain code quality and performance.

---

**Remember: These commandments are the foundation of code quality and must be followed without exception. They ensure maintainable, scalable, and high-quality code that can withstand the scrutiny of industry professionals like Jonathan Blow.**
