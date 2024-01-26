import {Component, OnInit} from '@angular/core';
import {AbstractControl, Form, FormBuilder, FormControl, FormGroup, ValidatorFn} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";

interface Property {
  key: string;
  value: string;
  active: boolean;
  defaultValue: string;
}

export function propertyValueRequired(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const property = control.value;
    if (!property || !property.value || property.value.trim() === '') {
      return { 'propertyValueRequired': true };
    }
    return null;
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit() {

    this.form = this.fb.group({});

    this.http.get('assets/famous.properties', { responseType: 'text' }).subscribe(data => {
      const lines = data.split('\n');

      lines.forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
          const [key, value] = line.split('=').map(s => s.trim());
          const defaultValue = value;
          const controlValue: Property = {key, value, active:false, defaultValue};
          const formControl : FormControl = this.fb.control(controlValue,  [propertyValueRequired()]) as FormControl;
          this.form.addControl(key, formControl);
        }
      });
    });
  }

  onSelected(event: MatAutocompleteSelectedEvent): void {
    const key = event.option.value;
    const control = this.form.controls[key];
    if (control) {
      const property: Property = control.value;
      property.active = !property.active;
      control.setValue(property);
    } else {
      console.log("onSelected", key, ' not found');
    }
  }

  toggleValue(key: string): void {
    const control = this.form.controls[key];
    if (control) {
      const property: Property = control.value;
      property.value = property.value === 'true' ? 'false' : 'true';
      control.setValue(property); // Update control value
    } else {
      console.log("toggleValue", key, ' not found');
    }
  }

  updatePropertyValue(key:string, event:any) {
    const value : string = event.target.value;
    const control = this.form.controls[key];
    if (control) {
      const property: Property = control.value;
      property.value = value;
      control.setValue(property);
    } else {
      console.log("reset", key, ' not found');
    }
  }

  getControl(key:string){
    const control : FormControl = this.form.controls[key] as FormControl;
    return control;
  }


  onSubmit(): number {
    return 1;
  }

  reset(key : string): void {
    const control = this.form.controls[key];
    if (control) {
      const property: Property = control.value;
      property.value = property.defaultValue;
      control.setValue(property);
    } else {
      console.log("reset", key, ' not found');
    }
  }

  formControlsKeys(): string[] {
    return Object.keys(this.form.controls);
  }


  getProperty(key: string): Property {
    const control = this.form.controls[key];
    // console.log("control", key, control);
    if (control) {
      return control.value as Property;
    } else {
      console.log("getProperty", key, ' not found');
      return { key: "null", value: "null", active: false, defaultValue: "null" };
    }
  }

}
