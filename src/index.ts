import { PreventOverScrolling, ReEnableOverScrolling } from 'prevent-overscrolling';
import { UAParser } from 'ua-parser-js';

import { USER_SCROLL_EVENTS, USER_SCROLL_KEYBOARD_EVENTS } from './user-scroll-events';
import { passiveSupported } from './passive-supported';

const IGNORE_PREVENT_WINDOW_SCROLL_BROWSERS = ['Mobile Safari', 'Safari', 'IE', 'Edge'];

const browser = new UAParser().getBrowser().name || '';
const win = window;

let allowScrollElements: HTMLElement[] = [];

let previousScrollX: number;
let previousScrollY: number;
let scrollableAreaHasFocus = false;
let scrollingPrevented = false;

win.addEventListener('click', handleWindowClick);

export function PreventScrolling(allowScrollingOn?: HTMLElement | HTMLElement[]): void {
	if (!scrollingPrevented) {
		scrollingPrevented = true;
		if (allowScrollingOn) {
			if (Array.isArray(allowScrollingOn)) {
				allowScrollElements = allowScrollingOn;
			} else {
				allowScrollElements = [allowScrollingOn];
			}
		}

		lockWindow();
		setScrollingEvents(true);
	}
}

export function ReEnableScrolling(): void {
	if (scrollingPrevented) {
		unlockWindow();
		setScrollingEvents(false);
		scrollingPrevented = false;
	}
}

function setScrollingEvents(enable: boolean): void {
	USER_SCROLL_EVENTS.forEach(event => {
		if (enable) {
			win.addEventListener(event, preventDefault, passiveSupported ? <any>{ passive: false } : null);
		} else {
			win.removeEventListener(event, preventDefault, passiveSupported ? <any>{ passive: false } : null);
		}
	});

	allowScrollElements.forEach(element => {
		if (enable) {
			element.addEventListener('click', handleScrollElementClick);
			PreventOverScrolling(element);
		} else {
			element.removeEventListener('click', handleScrollElementClick);
			ReEnableOverScrolling(element);
		}
	});

	if (enable) {
		win.addEventListener('keydown', preventDefaultKeyboard);
	} else {
		win.removeEventListener('keydown', preventDefaultKeyboard);
		allowScrollElements = [];
	}
}

function preventDefault(event: Event): void {
	const source = <HTMLElement>event.srcElement;

	if (!sourceIsScrollElementOrChild(source)) {
		event.preventDefault();
	}
}

function sourceIsScrollElementOrChild(element: HTMLElement): boolean {
	if (allowScrollElements.length) {
		return !!allowScrollElements.find(e => e === element || e.contains(element));
	}
	return false;
}

function preventDefaultKeyboard(event: KeyboardEvent): void {
	const keyCode = event.keyCode;
	const source = <HTMLElement>event.target;

	if (source.tagName !== 'INPUT' && source.tagName !== 'TEXTAREA' && !scrollableAreaHasFocus && USER_SCROLL_KEYBOARD_EVENTS.includes(keyCode)) {
		event.preventDefault();
	}
}

function lockWindow(): void {
	previousScrollX = win.pageXOffset;
	previousScrollY = win.pageYOffset;

	if (!IGNORE_PREVENT_WINDOW_SCROLL_BROWSERS.includes(browser)) {
		win.addEventListener('scroll', setWindowScroll);
	}
}

function unlockWindow(): void {
	win.removeEventListener('scroll', setWindowScroll);
}

function setWindowScroll(): void {
	win.scrollTo(previousScrollX, previousScrollY);
}

function handleWindowClick(): void {
	scrollableAreaHasFocus = false;
}

function handleScrollElementClick(): void {
	scrollableAreaHasFocus = true;
}
