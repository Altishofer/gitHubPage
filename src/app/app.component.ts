import {Component, OnInit} from '@angular/core';
import {AbstractControl, Form, FormBuilder, FormControl, FormGroup, ValidatorFn} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
  file : File | null = null;
  formStates: any = [];
  maxId : number = 0;

  loading: boolean = false;
  hitRate: number | null = null;


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

  onFileSelected(event: any){
    this.file = event.target.files[0];
  }

  resetFile(){
    this.file = null;
  }

  onSelected(key: string): void {
    const control = this.form.controls[key];
    if (control) {
      const property: Property = control.value;
      property.active = true;
      control.setValue(property);
    } else {
      console.log("onSelected", key, ' not found');
    }
  }

  setToInactive(key: string): void {
    const control = this.form.controls[key];
    if (control) {
      const property: Property = control.value;
      property.active = false;
      control.setValue(property);
    } else {
      console.log("onSelected", key, ' not found');
    }
  }

  toggleValue(key: string): void {
    this.hitRate = null;
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
    this.hitRate = null;
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
    if (control) {
      return control.value as Property;
    } else {
      console.log("getProperty", key, ' not found');
      return { key: "null", value: "null", active: false, defaultValue: "null" };
    }
  }


  saveProperties(hitRate:number){
    const prop : any = {};
    const keys : string[] = this.formControlsKeys();
    for (let i=0; i<keys.length; i++) {
      const property: Property = this.getProperty(keys[i]);
      const copy : Property = { key: property.key, value: property.value, active: property.active, defaultValue: property.defaultValue};
      prop[property.key] = copy;
      console.log(prop[property.key]);
    }
    this.maxId += 1;
    this.formStates.push({"id":this.maxId, "property":prop, "hitRate":hitRate});
  }

  loadConfig(index:number){
    const prop = this.formStates[index];
    console.log(prop);
    const keys = Object.keys(prop.property);
    for (let i=0; i<keys.length; i++) {
      const memProperty: Property = prop.property[keys[i]];
      const formProperty: Property = this.getProperty(keys[i]);
      formProperty.active = memProperty.active;
      formProperty.value = memProperty.value;
    }
  }

  resetAll(){
    const keys : string[] = this.formControlsKeys();
    for (let i=0; i<keys.length; i++) {
      this.reset(keys[i]);
    }
  }

  onSubmit() {
    this.loading = true;

    setTimeout(() => {
      this.hitRate = Math.floor(Math.random()*100);
      this.saveProperties(this.hitRate);
      this.resetAll();
      this.loading = false;
    }, 2000);
  }

  deleteConfig(index:number) : void{
    this.formStates.splice(index, 1);
  }

  downloadEmptyExcel(): void {
    const filePath = 'assets/output.xlsx';

    this.http.get(filePath, { responseType: 'blob' })
      .subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'assets/output.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
  }
}
