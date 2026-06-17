import { describe, it, expect } from 'vitest';
import {
  isMediaType,
  isValidTmdbId,
  isPositiveInt,
  isValidEmail,
  isValidPassword,
  normalizeHexColor,
} from './validation';

describe('validation utilities', () => {
  it('isMediaType only accepts movie/tv', () => {
    expect(isMediaType('movie')).toBe(true);
    expect(isMediaType('tv')).toBe(true);
    expect(isMediaType('person')).toBe(false);
  });

  it('isValidTmdbId accepts positive integers and numeric strings', () => {
    expect(isValidTmdbId(550)).toBe(true);
    expect(isValidTmdbId('1399')).toBe(true);
    expect(isValidTmdbId('abc')).toBe(false);
    expect(isValidTmdbId(0)).toBe(false);
    expect(isValidTmdbId(-3)).toBe(false);
  });

  it('isPositiveInt', () => {
    expect(isPositiveInt(2)).toBe(true);
    expect(isPositiveInt(0)).toBe(false);
    expect(isPositiveInt(1.5)).toBe(false);
  });

  it('isValidEmail', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
  });

  it('isValidPassword requires 6+ chars', () => {
    expect(isValidPassword('123456')).toBe(true);
    expect(isValidPassword('12345')).toBe(false);
  });

  it('normalizeHexColor strips # and validates', () => {
    expect(normalizeHexColor('#E50914')).toBe('e50914');
    expect(normalizeHexColor('00ff99')).toBe('00ff99');
    expect(normalizeHexColor('not-a-color')).toBe('e50914');
  });
});
