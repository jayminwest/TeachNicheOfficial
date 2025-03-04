import { cn } from './cn';

describe('cn utility', () => {
  it('should combine class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
    expect(cn('class1', null, 'class2')).toBe('class1 class2');
    expect(cn('class1', false && 'class2')).toBe('class1');
    expect(cn('class1', true && 'class2')).toBe('class1 class2');
  });

  it('should merge Tailwind classes correctly', () => {
    // Test conflicting classes - the last one should win
    expect(cn('p-4', 'p-6')).toBe('p-6');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    
    // Test non-conflicting classes
    expect(cn('p-4', 'm-2')).toBe('p-4 m-2');
    
    // Test conditional classes
    const isActive = true;
    const isDisabled = false;
    expect(cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class'
    )).toBe('base-class active-class');
  });

  it('should handle complex class combinations', () => {
    expect(cn(
      'fixed inset-0',
      'flex items-center justify-center',
      {
        'bg-black/50': true,
        'opacity-0': false,
        'opacity-100': true
      }
    )).toBe('fixed inset-0 flex items-center justify-center bg-black/50 opacity-100');
  });
});
