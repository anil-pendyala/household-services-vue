@app.route('/api/export_csv')
def export_csv():
     result = csv_report.delay()
     return jsonify({
          id: result.id,
          result: result.result
     })



@app.route('/api/csv_result/<id>')
def csv_result(id):
     result = AsyncResult(id)
     return {
          "ready": result.ready(),
          "successful": result.successful(),
          "value": result.result if result.ready else None,
     }
