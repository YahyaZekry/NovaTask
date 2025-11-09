import { expect } from '@jest/globals';
import { jestMatchers } from '@testing-library/jest-dom/matchers';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers with custom matchers
expect.extend(jestMatchers);
expect.extend(toHaveNoViolations);

// Custom matcher for checking if element has specific CSS class
expect.extend({
  toHaveClass(received: HTMLElement, expectedClass: string) {
    const pass = received.classList.contains(expectedClass);
    
    if (pass) {
      return {
        message: () => `expected element not to have class "${expectedClass}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have class "${expectedClass}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific CSS styles
expect.extend({
  toHaveStyle(received: HTMLElement, expectedStyles: Record<string, string>) {
    const computedStyles = window.getComputedStyle(received);
    const missingStyles: string[] = [];
    
    for (const [property, value] of Object.entries(expectedStyles)) {
      const actualValue = computedStyles.getPropertyValue(property);
      if (actualValue !== value) {
        missingStyles.push(`${property}: expected "${value}", received "${actualValue}"`);
      }
    }
    
    if (missingStyles.length === 0) {
      return {
        message: () => `expected element not to have styles ${JSON.stringify(expectedStyles)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have styles ${JSON.stringify(expectedStyles)}, but missing: ${missingStyles.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is visible
expect.extend({
  toBeVisible(received: HTMLElement) {
    const computedStyles = window.getComputedStyle(received);
    const isVisible = computedStyles.display !== 'none' && 
                     computedStyles.visibility !== 'hidden' && 
                     computedStyles.opacity !== '0' &&
                     received.offsetWidth > 0 && 
                     received.offsetHeight > 0;
    
    if (isVisible) {
      return {
        message: () => `expected element not to be visible`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be visible`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is hidden
expect.extend({
  toBeHidden(received: HTMLElement) {
    const computedStyles = window.getComputedStyle(received);
    const isHidden = computedStyles.display === 'none' || 
                    computedStyles.visibility === 'hidden' || 
                    computedStyles.opacity === '0' ||
                    received.offsetWidth === 0 || 
                    received.offsetHeight === 0;
    
    if (isHidden) {
      return {
        message: () => `expected element not to be hidden`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be hidden`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific ARIA attribute
expect.extend({
  toHaveAria(received: HTMLElement, attribute: string, value?: string) {
    const hasAttribute = received.hasAttribute(`aria-${attribute}`);
    const actualValue = received.getAttribute(`aria-${attribute}`);
    
    if (!hasAttribute) {
      return {
        message: () => `expected element to have aria-${attribute} attribute`,
        pass: false,
      };
    }
    
    if (value !== undefined && actualValue !== value) {
      return {
        message: () => `expected element to have aria-${attribute}="${value}", but received aria-${attribute}="${actualValue}"`,
        pass: false,
      };
    }
    
    return {
      message: () => value !== undefined 
        ? `expected element not to have aria-${attribute}="${value}"`
        : `expected element not to have aria-${attribute} attribute`,
      pass: true,
    };
  },
});

// Custom matcher for checking if element has specific role
expect.extend({
  toHaveRole(received: HTMLElement, expectedRole: string) {
    const actualRole = received.getAttribute('role');
    const pass = actualRole === expectedRole;
    
    if (pass) {
      return {
        message: () => `expected element not to have role "${expectedRole}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have role "${expectedRole}", but received "${actualRole}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is focusable
expect.extend({
  toBeFocusable(received: HTMLElement) {
    const isFocusable = received.tabIndex >= 0 && 
                       !received.hasAttribute('disabled') &&
                       !received.hasAttribute('aria-hidden');
    
    if (isFocusable) {
      return {
        message: () => `expected element not to be focusable`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be focusable`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is in viewport
expect.extend({
  toBeInViewport(received: HTMLElement) {
    const rect = received.getBoundingClientRect();
    const isInViewport = rect.top >= 0 && 
                        rect.left >= 0 && 
                        rect.bottom <= window.innerHeight && 
                        rect.right <= window.innerWidth;
    
    if (isInViewport) {
      return {
        message: () => `expected element not to be in viewport`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be in viewport`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific data attribute
expect.extend({
  toHaveDataAttribute(received: HTMLElement, attribute: string, value?: string) {
    const hasAttribute = received.hasAttribute(`data-${attribute}`);
    const actualValue = received.getAttribute(`data-${attribute}`);
    
    if (!hasAttribute) {
      return {
        message: () => `expected element to have data-${attribute} attribute`,
        pass: false,
      };
    }
    
    if (value !== undefined && actualValue !== value) {
      return {
        message: () => `expected element to have data-${attribute}="${value}", but received data-${attribute}="${actualValue}"`,
        pass: false,
      };
    }
    
    return {
      message: () => value !== undefined 
        ? `expected element not to have data-${attribute}="${value}"`
        : `expected element not to have data-${attribute} attribute`,
      pass: true,
    };
  },
});

// Custom matcher for checking if element is disabled
expect.extend({
  toBeDisabled(received: HTMLElement) {
    const isDisabled = received.hasAttribute('disabled') || 
                      received.getAttribute('aria-disabled') === 'true';
    
    if (isDisabled) {
      return {
        message: () => `expected element not to be disabled`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be disabled`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is required
expect.extend({
  toBeRequired(received: HTMLElement) {
    const isRequired = received.hasAttribute('required') || 
                      received.getAttribute('aria-required') === 'true';
    
    if (isRequired) {
      return {
        message: () => `expected element not to be required`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be required`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific text content
expect.extend({
  toHaveTextContent(received: HTMLElement, expectedText: string, options: { exact?: boolean } = {}) {
    const actualText = received.textContent || '';
    const pass = options.exact 
      ? actualText === expectedText
      : actualText.includes(expectedText);
    
    if (pass) {
      return {
        message: () => `expected element not to have text content "${expectedText}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have text content "${expectedText}", but received "${actualText}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific value
expect.extend({
  toHaveValue(received: HTMLElement, expectedValue: string) {
    const element = received as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const actualValue = element.value;
    const pass = actualValue === expectedValue;
    
    if (pass) {
      return {
        message: () => `expected element not to have value "${expectedValue}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have value "${expectedValue}", but received "${actualValue}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is checked
expect.extend({
  toBeChecked(received: HTMLElement) {
    const element = received as HTMLInputElement;
    const isChecked = element.checked;
    
    if (isChecked) {
      return {
        message: () => `expected element not to be checked`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be checked`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific tag name
expect.extend({
  toHaveTagName(received: HTMLElement, expectedTagName: string) {
    const actualTagName = received.tagName.toLowerCase();
    const expectedTag = expectedTagName.toLowerCase();
    const pass = actualTagName === expectedTag;
    
    if (pass) {
      return {
        message: () => `expected element not to have tag name "${expectedTagName}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have tag name "${expectedTagName}", but received "${actualTagName}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific ID
expect.extend({
  toHaveId(received: HTMLElement, expectedId: string) {
    const actualId = received.id;
    const pass = actualId === expectedId;
    
    if (pass) {
      return {
        message: () => `expected element not to have id "${expectedId}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have id "${expectedId}", but received "${actualId}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is a form element
expect.extend({
  toBeFormElement(received: HTMLElement) {
    const formTags = ['input', 'select', 'textarea', 'button'];
    const actualTag = received.tagName.toLowerCase();
    const pass = formTags.includes(actualTag);
    
    if (pass) {
      return {
        message: () => `expected element not to be a form element`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be a form element, but received "${actualTag}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific placeholder
expect.extend({
  toHavePlaceholder(received: HTMLElement, expectedPlaceholder: string) {
    const element = received as HTMLInputElement | HTMLTextAreaElement;
    const actualPlaceholder = element.placeholder;
    const pass = actualPlaceholder === expectedPlaceholder;
    
    if (pass) {
      return {
        message: () => `expected element not to have placeholder "${expectedPlaceholder}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have placeholder "${expectedPlaceholder}", but received "${actualPlaceholder}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific title
expect.extend({
  toHaveTitle(received: HTMLElement, expectedTitle: string) {
    const actualTitle = received.title;
    const pass = actualTitle === expectedTitle;
    
    if (pass) {
      return {
        message: () => `expected element not to have title "${expectedTitle}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have title "${expectedTitle}", but received "${actualTitle}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific alt text
expect.extend({
  toHaveAltText(received: HTMLElement, expectedAlt: string) {
    const element = received as HTMLImageElement;
    const actualAlt = element.alt;
    const pass = actualAlt === expectedAlt;
    
    if (pass) {
      return {
        message: () => `expected element not to have alt text "${expectedAlt}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have alt text "${expectedAlt}", but received "${actualAlt}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific src
expect.extend({
  toHaveSrc(received: HTMLElement, expectedSrc: string) {
    const element = received as HTMLImageElement | HTMLScriptElement | HTMLIFrameElement;
    const actualSrc = element.src;
    const pass = actualSrc.includes(expectedSrc);
    
    if (pass) {
      return {
        message: () => `expected element not to have src containing "${expectedSrc}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have src containing "${expectedSrc}", but received "${actualSrc}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific href
expect.extend({
  toHaveHref(received: HTMLElement, expectedHref: string) {
    const element = received as HTMLAnchorElement;
    const actualHref = element.href;
    const pass = actualHref.includes(expectedHref);
    
    if (pass) {
      return {
        message: () => `expected element not to have href containing "${expectedHref}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have href containing "${expectedHref}", but received "${actualHref}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific type
expect.extend({
  toHaveType(received: HTMLElement, expectedType: string) {
    const element = received as HTMLInputElement;
    const actualType = element.type;
    const pass = actualType === expectedType;
    
    if (pass) {
      return {
        message: () => `expected element not to have type "${expectedType}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have type "${expectedType}", but received "${actualType}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific name
expect.extend({
  toHaveName(received: HTMLElement, expectedName: string) {
    const element = received as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const actualName = element.name;
    const pass = actualName === expectedName;
    
    if (pass) {
      return {
        message: () => `expected element not to have name "${expectedName}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have name "${expectedName}", but received "${actualName}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is valid
expect.extend({
  toBeValid(received: HTMLElement) {
    const element = received as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const isValid = element.validity?.valid ?? true;
    
    if (isValid) {
      return {
        message: () => `expected element not to be valid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be valid`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is invalid
expect.extend({
  toBeInvalid(received: HTMLElement) {
    const element = received as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const isInvalid = element.validity?.valid === false;
    
    if (isInvalid) {
      return {
        message: () => `expected element not to be invalid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be invalid`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific validation message
expect.extend({
  toHaveValidationMessage(received: HTMLElement, expectedMessage: string) {
    const element = received as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const actualMessage = element.validationMessage;
    const pass = actualMessage === expectedMessage;
    
    if (pass) {
      return {
        message: () => `expected element not to have validation message "${expectedMessage}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have validation message "${expectedMessage}", but received "${actualMessage}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific pattern
expect.extend({
  toHavePattern(received: HTMLElement, expectedPattern: string) {
    const element = received as HTMLInputElement;
    const actualPattern = element.pattern;
    const pass = actualPattern === expectedPattern;
    
    if (pass) {
      return {
        message: () => `expected element not to have pattern "${expectedPattern}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have pattern "${expectedPattern}", but received "${actualPattern}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific min/max values
expect.extend({
  toHaveMinMax(received: HTMLElement, min?: string, max?: string) {
    const element = received as HTMLInputElement;
    const actualMin = element.min;
    const actualMax = element.max;
    
    let pass = true;
    let message = '';
    
    if (min !== undefined && actualMin !== min) {
      pass = false;
      message += `expected min to be "${min}", but received "${actualMin}"`;
    }
    
    if (max !== undefined && actualMax !== max) {
      pass = false;
      message += `${message ? '; ' : ''}expected max to be "${max}", but received "${actualMax}"`;
    }
    
    if (pass) {
      return {
        message: () => `expected element not to have min="${min}" and max="${max}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have min="${min}" and max="${max}", but ${message}`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific step
expect.extend({
  toHaveStep(received: HTMLElement, expectedStep: string) {
    const element = received as HTMLInputElement;
    const actualStep = element.step;
    const pass = actualStep === expectedStep;
    
    if (pass) {
      return {
        message: () => `expected element not to have step "${expectedStep}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have step "${expectedStep}", but received "${actualStep}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is read-only
expect.extend({
  toBeReadOnly(received: HTMLElement) {
    const element = received as HTMLInputElement | HTMLTextAreaElement;
    const isReadOnly = element.readOnly;
    
    if (isReadOnly) {
      return {
        message: () => `expected element not to be read-only`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be read-only`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element is auto-complete
expect.extend({
  toHaveAutoComplete(received: HTMLElement, expectedAutoComplete: string) {
    const element = received as HTMLInputElement;
    const actualAutoComplete = element.autocomplete;
    const pass = actualAutoComplete === expectedAutoComplete;
    
    if (pass) {
      return {
        message: () => `expected element not to have autocomplete "${expectedAutoComplete}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have autocomplete "${expectedAutoComplete}", but received "${actualAutoComplete}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific input mode
expect.extend({
  toHaveInputMode(received: HTMLElement, expectedInputMode: string) {
    const element = received as HTMLInputElement;
    const actualInputMode = element.inputMode;
    const pass = actualInputMode === expectedInputMode;
    
    if (pass) {
      return {
        message: () => `expected element not to have inputmode "${expectedInputMode}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have inputmode "${expectedInputMode}", but received "${actualInputMode}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific spellcheck
expect.extend({
  toHaveSpellCheck(received: HTMLElement, expectedSpellCheck: boolean) {
    const element = received as HTMLInputElement | HTMLTextAreaElement;
    const actualSpellCheck = element.spellcheck;
    const pass = actualSpellCheck === expectedSpellCheck;
    
    if (pass) {
      return {
        message: () => `expected element not to have spellcheck ${expectedSpellCheck}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have spellcheck ${expectedSpellCheck}, but received ${actualSpellCheck}`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific autocorrect
expect.extend({
  toHaveAutoCorrect(received: HTMLElement, expectedAutoCorrect: string) {
    const element = received as HTMLInputElement | HTMLTextAreaElement;
    const actualAutoCorrect = element.getAttribute('autocorrect');
    const pass = actualAutoCorrect === expectedAutoCorrect;
    
    if (pass) {
      return {
        message: () => `expected element not to have autocorrect "${expectedAutoCorrect}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have autocorrect "${expectedAutoCorrect}", but received "${actualAutoCorrect}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific autocapitalize
expect.extend({
  toHaveAutoCapitalize(received: HTMLElement, expectedAutoCapitalize: string) {
    const element = received as HTMLInputElement | HTMLTextAreaElement;
    const actualAutoCapitalize = element.getAttribute('autocapitalize');
    const pass = actualAutoCapitalize === expectedAutoCapitalize;
    
    if (pass) {
      return {
        message: () => `expected element not to have autocapitalize "${expectedAutoCapitalize}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have autocapitalize "${expectedAutoCapitalize}", but received "${actualAutoCapitalize}"`,
        pass: false,
      };
    }
  },
});

// Custom matcher for checking if element has specific enterkeyhint
expect.extend({
  toHaveEnterKeyHint(received: HTMLElement, expectedEnterKeyHint: string) {
    const element = received as HTMLInputElement;
    const actualEnterKeyHint = element.getAttribute('enterkeyhint');
    const pass = actualEnterKeyHint === expectedEnterKeyHint;
    
    if (pass) {
      return {
        message: () => `expected element not to have enterkeyhint "${expectedEnterKeyHint}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have enterkeyhint "${expectedEnterKeyHint}", but received "${actualEnterKeyHint}"`,
        pass: false,
      };
    }
  },
});

// Export all custom matchers
export * from '@testing-library/jest-dom/matchers';
export { toHaveNoViolations } from 'jest-axe';