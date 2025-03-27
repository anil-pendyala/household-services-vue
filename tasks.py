from celery import shared_task
from models import ServiceRequest
import datetime
import csv

@shared_task(ignore_result=False, name="export_csv")
def csv_report():
    all_requests = ServiceRequest.query.filter_by(service_status='CLOSED').all()

    csv_file_name = f"requests_{datetime.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.csv"
    with open(f'static/{csv_file_name}', 'w', newline = "") as f:
        sr_no = 1
        requests_csv = csv.writer(f, delimiter = ",")
        requests_csv.writerow(['Sr_No', 'Request_Id', 'Service_Id', 'Customer_Id', 'Professional_Id', 'Date_of_Request', 'Date_of_Completion', 'Remarks', 'Location', 'Pincode'])

        for request in all_requests:
            requests_csv.writerow([sr_no, request.id, request.service_id, request.customer_id, request.professional_id, request.date_of_request, request.date_of_completion, request.remarks, request.location, request.pin_code])
            sr_no += 1

    return csv_file_name
