import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { VerGenComponent } from './ver-gen/ver-gen.component';
import { VerRegisterComponent, RegisterDialog } from './ver-register/ver-register.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { AppComponent, NavrowComponent } from './app.component';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';

@NgModule({
    declarations: [
        AppComponent,
        VerGenComponent,
        VerRegisterComponent,
        RegisterDialog,
        ProgressBarComponent,
        NavrowComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FormsModule,
        MatListModule,
        MatExpansionModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatSelectModule,
        MatGridListModule,
        MatToolbarModule,
        MatSidenavModule,
        MatDividerModule,
        MatTableModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
