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
import { JobHistoryComponent } from './job-history/job-history.component';
import { VerFileExplorerComponent } from './ver-file-explorer/ver-file-explorer.component';
import { DashComponent } from './dash/dash.component';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { LayoutModule } from '@angular/cdk/layout';
import { NavComponent } from './nav/nav.component';
import { AppRoutingModule } from './app-routing.module';
import { CardComponent } from './card/card.component';
import { APP_BASE_HREF } from '@angular/common';

@NgModule({
    declarations: [
        AppComponent,
        VerGenComponent,
        VerRegisterComponent,
        RegisterDialog,
        ProgressBarComponent,
        NavrowComponent,
        JobHistoryComponent,
        VerFileExplorerComponent,
        DashComponent,
        NavComponent,
        CardComponent,
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
        MatTableModule,
        MatCardModule,
        MatMenuModule,
        MatIconModule,
        LayoutModule,
        AppRoutingModule
    ],
    providers: [{ provide: APP_BASE_HREF, useValue: '/manager' }],
    bootstrap: [AppComponent]
})
export class AppModule { }
