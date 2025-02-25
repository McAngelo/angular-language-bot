import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angular-language-bot';
  constructor(public translateService: TranslateService) {

    translateService.addLangs(['en-US', 'fr-FR']);  
    translateService.setDefaultLang('en-US'); 
  }

  public changeLanguage(language: string): void {
      this.translateService.use(language);
  }

  /* switchLang(lang: string) {  
    this.translateService.use(lang);  
 }   */
}
