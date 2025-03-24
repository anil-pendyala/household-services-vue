// customer-booking.js
const BookService = {
     template: `
       <div class="container mt-4">
         <h2 class="mb-4">Book a Service</h2>

         <!-- Search Bar -->
         <div class="row mb-4">
  <div class="col-md-6 mx-auto">
    <div class="input-group border rounded-pill shadow-sm" style="border: 2px solid #6c757d; overflow: hidden;">
      <span class="input-group-text bg-white border-0">
        <i class="bi bi-search text-dark"></i>
      </span>
      <input
        type="text"
        class="form-control border-0 shadow-none"
        placeholder="Search services..."
        v-model="searchQuery"
        @input="filterServices"
        style="outline: none; box-shadow: none;"
      >
      <button
        class="btn btn-outline-secondary border-0"
        type="button"
        @click="clearSearch"
        v-if="searchQuery"
      >
        <i class="bi bi-x text-dark"></i>
      </button>
    </div>
  </div>
</div>



         <!-- Services Table -->
         <table class="table table-hover table-bordered">
           <thead class="table-light">
             <tr>
               <th>Service</th>
               <th>Description</th>
               <th>Price</th>
               <th>Duration</th>
               <th>Action</th>
             </tr>
           </thead>
           <tbody>
             <tr v-for="service in filteredServices" :key="service.id">
               <td><strong>{{ service.name }}</strong></td>
               <td>{{ service.description }}</td>
               <td>₹{{ service.base_price }}</td>
               <td>{{ formatTime(service.time_required) }}</td>
               <td>
                 <button @click="selectService(service)" class="btn btn-primary btn-sm">Book Now</button>
               </td>
             </tr>
             <tr v-if="filteredServices.length === 0 && !loading">
               <td colspan="5" class="text-center">
                 <div v-if="searchQuery">
                   No services found matching "{{ searchQuery }}". Try a different search term.
                 </div>
                 <div v-else>
                   No services available at the moment.
                 </div>
               </td>
             </tr>
             <tr v-if="loading">
               <td colspan="5" class="text-center">
                 <div class="spinner-border spinner-border-sm text-primary" role="status">
                   <span class="visually-hidden">Loading...</span>
                 </div>
                 Loading services...
               </td>
             </tr>
           </tbody>
         </table>

         <!-- Simple Booking Form -->
         <div v-if="selectedService.id" class="mt-4 p-3 border">
           <h4>Book {{ selectedService.name }} - ₹{{ selectedService.base_price }}</h4>

           <form @submit.prevent="submitBooking">
             <div class="row mb-3">
               <div class="col-md-6">
                 <label class="form-label">Date</label>
                 <input type="date" class="form-control" v-model="bookingForm.preferredDate" required :min="minDate">
               </div>
               <div class="col-md-6">
                 <label class="form-label">Time</label>
                 <select class="form-select" v-model="bookingForm.preferredTime" required>
                   <option value="">Select time</option>
                   <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                   <option value="afternoon">Afternoon (12:00 PM - 4:00 PM)</option>
                   <option value="evening">Evening (4:00 PM - 8:00 PM)</option>
                 </select>
               </div>
             </div>

             <div class="row mb-3">
               <div class="col-md-8">
                 <label class="form-label">Location</label>
                 <input type="text" class="form-control" v-model="bookingForm.location" required>
               </div>
               <div class="col-md-4">
                 <label class="form-label">PIN Code</label>
                 <input type="text" class="form-control" v-model="bookingForm.pinCode" maxlength="6" pattern="[0-9]{6}" required>
               </div>
             </div>

             <div class="mb-3">
               <label class="form-label">Remarks</label>
               <textarea class="form-control" v-model="bookingForm.remarks" rows="2"></textarea>
             </div>

             <div v-if="bookingError" class="alert alert-danger py-2">{{ bookingError }}</div>

             <div class="d-flex gap-2 justify-content-end">
               <button type="button" class="btn btn-secondary" @click="selectedService = {}">Cancel</button>
               <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                 {{ isSubmitting ? 'Submitting...' : 'Book Service' }}
               </button>
             </div>
           </form>
         </div>
       </div>
     `,

     data() {
       return {
         services: [],
         filteredServices: [],
         searchQuery: '',
         selectedService: {},
         bookingForm: {
           preferredDate: '',
           preferredTime: '',
           location: '',
           pinCode: '',
           remarks: ''
         },
         bookingError: '',
         isSubmitting: false,
         loading: true,
         minDate: new Date().toISOString().split('T')[0]
       };
     },

     mounted() {
       this.fetchServices();

       const userId = localStorage.getItem('userId');
       if (!userId) {
         this.$router.push('/login');
         return;
       }

       this.fetchCustomerInfo();
     },

     methods: {
       fetchServices() {
         this.loading = true;
         axios.get('http://127.0.0.1:5000/services')
           .then(response => {
             this.services = response.data;
             this.filteredServices = [...this.services]; // Initialize filtered services
           })
           .catch(error => {
             console.error('Error fetching services:', error);
           })
           .finally(() => {
             this.loading = false;
           });
       },

       fetchCustomerInfo() {
         const userId = localStorage.getItem('userId');
         if (!userId) return;

         axios.get(`http://127.0.0.1:5000/customers/${userId}`)
           .then(response => {
             this.bookingForm.location = response.data.location || '';
             this.bookingForm.pinCode = response.data.pin_code || '';
           })
           .catch(error => {
             console.error('Error fetching customer info:', error);
           });
       },

       filterServices() {
         if (!this.searchQuery.trim()) {
           this.filteredServices = [...this.services];
           return;
         }

         const query = this.searchQuery.toLowerCase().trim();
         this.filteredServices = this.services.filter(service =>
           service.name.toLowerCase().includes(query) ||
           service.description.toLowerCase().includes(query)
         );
       },

       clearSearch() {
         this.searchQuery = '';
         this.filterServices();
       },

       selectService(service) {
         this.selectedService = service;
         this.bookingError = '';
         this.bookingForm.preferredDate = '';
         this.bookingForm.preferredTime = '';
         this.bookingForm.remarks = '';
       },

       submitBooking() {
         this.isSubmitting = true;
         this.bookingError = '';

         const customerId = localStorage.getItem('userId');
         if (!customerId) {
           this.bookingError = 'Please log in to book a service';
           this.isSubmitting = false;
           return;
         }

         const preferredDate = new Date(this.bookingForm.preferredDate);

         const requestData = {
           customer_id: customerId,
           service_id: this.selectedService.id,
           preferred_date: preferredDate.toISOString(),
           preferred_time: this.bookingForm.preferredTime,
           location: this.bookingForm.location,
           pin_code: this.bookingForm.pinCode,
           remarks: this.bookingForm.remarks,
           service_status: 'REQUESTED'
         };

         axios.post('http://127.0.0.1:5000/service-requests', requestData)
           .then(response => {
             alert('Service booked successfully!');
             this.$router.push('/customer/my-bookings');
           })
           .catch(error => {
             console.error('Error booking service:', error);
             this.bookingError = error.response?.data?.error || 'Error booking service. Please try again.';
           })
           .finally(() => {
             this.isSubmitting = false;
           });
       },

       formatTime(minutes) {
         if (!minutes) return 'N/A';
         const hours = Math.floor(minutes / 60);
         const mins = minutes % 60;

         if (hours === 0) {
           return `${mins} minutes`;
         } else if (mins === 0) {
           return `${hours} hour${hours > 1 ? 's' : ''}`;
         } else {
           return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
         }
       }
     }
   };
