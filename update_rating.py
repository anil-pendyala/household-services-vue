class Review(db.Model):
    # ... existing code ...

    def update_professional_rating(self):
        """Update the professional's average rating after a review is submitted"""
        professional = self.professional

        # Calculate the average rating from all reviews
        reviews = Review.query.filter_by(professional_id=professional.id).all()
        total_rating = sum(review.rating for review in reviews)
        avg_rating = total_rating / len(reviews) if reviews else 0

        # Update the professional's rating
        professional.rating = round(avg_rating, 1)  # Round to 1 decimal place
        db.session.commit()














@app.route('/submit_review', methods=['POST'])
def submit_review():
    # ... code to create the review ...

    review = Review(
        service_request_id=request.form.get('service_request_id'),
        customer_id=current_user.id,
        professional_id=request.form.get('professional_id'),
        rating=request.form.get('rating'),
        review_text=request.form.get('review_text')
    )

    db.session.add(review)
    db.session.commit()

    # Update the professional's rating
    review.update_professional_rating()

    # ... rest of your code ...
