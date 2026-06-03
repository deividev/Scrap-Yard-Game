import { TestBed } from '@angular/core/testing';
import { AppSelectComponent, SelectOption } from './app-select.component';

describe('AppSelectComponent', () => {
  const options: SelectOption[] = [
    { value: 'es', label: 'Spanish' },
    { value: 'en', label: 'English' },
  ];

  it('should show the selected label, emit changes, and close on outside click', async () => {
    const fixture = TestBed.createComponent(AppSelectComponent);
    let selectedValue = '';
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', 'es');
    fixture.componentInstance.changed.subscribe((value) => {
      selectedValue = value;
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.select-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBe(true);
    expect(fixture.componentInstance.selectedLabel()).toBe('Spanish');

    const optionButtons = Array.from(fixture.nativeElement.querySelectorAll('.select-option')) as HTMLButtonElement[];
    optionButtons[1].click();
    fixture.detectChanges();

    expect(selectedValue).toBe('en');
    expect(fixture.componentInstance.isOpen()).toBe(false);

    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBe(false);
  });
});