'use client';

import React from 'react';

/**
 * Accessibility Test Component
 * Displays color combinations to verify WCAG AA contrast ratios (4.5:1)
 */
export default function AccessibilityTest() {
  const colorCombinations = [
    {
      name: 'Text Primary on Background',
      bg: 'bg-background',
      text: 'text-text-primary',
      expected: '4.5:1+',
      description: 'Main text content'
    },
    {
      name: 'Text Secondary on Background',
      bg: 'bg-background',
      text: 'text-text-secondary',
      expected: '4.5:1+',
      description: 'Secondary information'
    },
    {
      name: 'Text Tertiary on Background',
      bg: 'bg-background',
      text: 'text-text-tertiary',
      expected: '3:1+',
      description: 'Muted text (AA large text)'
    },
    {
      name: 'Buttons (Buy/Sell) on Surface',
      bg: 'bg-surface',
      text: 'text-white',
      expected: '4.5:1+',
      description: 'Primary action buttons'
    },
    {
      name: 'Borders on Surface',
      bg: 'bg-surface',
      border: 'border-border',
      expected: '3:1+',
      description: 'Input and panel borders'
    },
    {
      name: 'Focus Ring',
      bg: 'bg-surface',
      focus: 'focus-visible:ring-focus-ring',
      expected: '3:1+',
      description: 'Keyboard focus indicators'
    },
    {
      name: 'Trading Colors on Light Background',
      bg: 'bg-white',
      text: 'text-long-strong',
      expected: '4.5:1+',
      description: 'Green text on white'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-text-primary">Accessibility Color Contrast Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colorCombinations.map((combo, index) => (
          <div key={index} className="panel p-4 space-y-3">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-text-primary">{combo.name}</h3>
                <span className="text-xs text-text-tertiary bg-surface-elevated px-2 py-1 rounded">
                  Target: {combo.expected}
                </span>
              </div>

              <div className="text-xs text-text-tertiary">{combo.description}</div>

              <div className={`p-4 rounded ${combo.bg} ${combo.text} ${combo.border || ''} border`}>
                <p className="font-mono">Sample text content</p>
                <p className="text-sm mt-1">Secondary information</p>
                <p className="text-xs mt-1">Muted tertiary text</p>
              </div>

              <div className="flex gap-2">
                <button className="btn btn-buy text-xs">Buy Button</button>
                <button className="btn btn-sell text-xs">Sell Button</button>
              </div>

              <div className="text-xs text-text-tertiary border border-border p-2 rounded">
                Focus me: <input className="input text-xs w-full" placeholder="Input field" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-surface-elevated border border-border rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-text-primary">WCAG Compliance Notes</h2>
        <ul className="text-text-secondary text-sm space-y-1">
          <li>• Normal text requires 4.5:1 contrast ratio (WCAG AA)</li>
          <li>• Large text (18pt+) requires 3:1 contrast ratio (WCAG AA)</li>
          <li>• Focus indicators should have 3:1 contrast against adjacent colors</li>
          <li>• Interactive elements should be clearly distinguishable</li>
          <li>• Support for reduced motion and high contrast preferences</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-surface-elevated border border-border rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-text-primary">Testing Instructions</h2>
        <ul className="text-text-secondary text-sm space-y-1">
          <li>1. Use browser developer tools to inspect color values</li>
          <li>2. Use online contrast checker tools (e.g., WebAIM)</li>
          <li>3. Test with actual screen readers</li>
          <li>4. Verify keyboard navigation works</li>
          <li>5. Test with high contrast mode enabled</li>
          <li>6. Test with reduced motion preferences</li>
        </ul>
      </div>
    </div>
  );
}