import {
  formatTime,
  formatTimerDisplay,
  truncateTitle,
} from '../../pages/Course/utils/courseUtils';

describe('courseUtils', () => {
  it('formatTime handles NaN', () => {
    expect(formatTime(NaN)).toBe('0:00');
  });

  it('formatTime formats seconds', () => {
    expect(formatTime(125)).toBe('2:05');
  });

  it('formatTimerDisplay pads and handles zero', () => {
    expect(formatTimerDisplay(0)).toBe('00:00');
    expect(formatTimerDisplay(65)).toBe('01:05');
  });

  it('truncateTitle handles empty and long titles', () => {
    expect(truncateTitle('')).toBe('Course Content');
    expect(truncateTitle('Short')).toBe('Short');
    expect(truncateTitle('One Two Three')).toBe('One Two...');
  });
});
