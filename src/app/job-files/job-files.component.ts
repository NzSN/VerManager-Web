import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JobResult } from '../jobResult';


@Component({
    selector: 'app-job-files',
    templateUrl: './job-files.component.html',
    styleUrls: ['./job-files.component.css']
})
export class JobFilesComponent implements OnInit {

    constructor() { }

    ngOnInit(): void {

    }
}
