import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import './AdminExams.css';

const AdminExams = () => {
  const [adminexamTerms, setAdminexamTerms] = useState([]);
  const [adminexamClasses, setAdminexamClasses] = useState([]);
  const [adminexamSubjects, setAdminexamSubjects] = useState([]);
  const [adminexamStudents, setAdminexamStudents] = useState([]);
  const [adminexamMarks, setAdminexamMarks] = useState([]);
  const [adminexamAlerts, setAdminexamAlerts] = useState([]);
  const [adminexamSelectedTerm, setAdminexamSelectedTerm] = useState('');
  const [adminexamSelectedClass, setAdminexamSelectedClass] = useState('');
  const [adminexamSelectedSubject, setAdminexamSelectedSubject] = useState('');
  const [adminexamShowModal, setAdminexamShowModal] = useState(false);
  const [adminexamForm, setAdminexamForm] = useState({ student_id: '', marks_obtained: '', total_marks: 100 });

  const adminexamAddAlert = (msg, type = 'success') => {
    const id = Date.now();
    setAdminexamAlerts(p => [...p, { id, message: msg, type }]);
    setTimeout(() => setAdminexamAlerts(p => p.filter(a => a.id !== id)), 5000);
  };

  useEffect(() => {
    fetch('/api/admin/terms').then(r => r.json()).then(d => setAdminexamTerms(d || []));
    fetch('/api/admin/subjects').then(r => r.json()).then(d => setAdminexamSubjects(d || []));
  }, []);

  useEffect(() => {
    if (adminexamSelectedTerm) {
      fetch(`/api/admin/classes?term_id=${adminexamSelectedTerm}`).then(r => r.json()).then(d => setAdminexamClasses(d || []));
    }
  }, [adminexamSelectedTerm]);

  useEffect(() => {
    if (adminexamSelectedClass) {
      fetch(`/api/admin/class/${adminexamSelectedClass}/students`).then(r => r.json()).then(d => setAdminexamStudents(d.students || []));
    }
  }, [adminexamSelectedClass]);

  const adminexamSubmitMarks = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/exam-marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...adminexamForm,
          subject_id: adminexamSelectedSubject,
          term_id: adminexamSelectedTerm
        })
      });
      adminexamAddAlert('Marks recorded successfully', 'success');
      setAdminexamShowModal(false);
      setAdminexamForm({ student_id: '', marks_obtained: '', total_marks: 100 });
    } catch {
      adminexamAddAlert('Error recording marks', 'error');
    }
  };

  return (
    <AdminLayout pageTitle="Exam Management" pageDescription="Manage exams and record student marks">
      <div className="adminexam-alerts-container">
        {adminexamAlerts.map(alert => (
          <div key={alert.id} className={`adminexam-alert adminexam-alert-${alert.type}`}>{alert.message}</div>
        ))}
      </div>
      <div className="adminexam-container">
        <div className="adminexam-header">
          <div className="adminexam-header-left">
            <h1 className="adminexam-page-title">Exam Management</h1>
            <p className="adminexam-page-subtitle">Record and manage student exam marks</p>
          </div>
          <button className="adminexam-btn adminexam-btn-primary" onClick={() => setAdminexamShowModal(true)} disabled={!adminexamSelectedSubject}>
            ➕ Record Marks
          </button>
        </div>
        <div className="adminexam-filters">
          <div className="adminexam-filter-group">
            <label>Term:</label>
            <select value={adminexamSelectedTerm} onChange={(e) => setAdminexamSelectedTerm(e.target.value)} className="adminexam-filter-select">
              <option value="">Select Term</option>
              {adminexamTerms.map(t => <option key={t._id} value={t._id}>Term {t.term_number}</option>)}
            </select>
          </div>
          <div className="adminexam-filter-group">
            <label>Class:</label>
            <select value={adminexamSelectedClass} onChange={(e) => setAdminexamSelectedClass(e.target.value)} className="adminexam-filter-select" disabled={!adminexamSelectedTerm}>
              <option value="">Select Class</option>
              {adminexamClasses.map(c => <option key={c._id} value={c._id}>{c.class_name}</option>)}
            </select>
          </div>
          <div className="adminexam-filter-group">
            <label>Subject:</label>
            <select value={adminexamSelectedSubject} onChange={(e) => setAdminexamSelectedSubject(e.target.value)} className="adminexam-filter-select" disabled={!adminexamSelectedClass}>
              <option value="">Select Subject</option>
              {adminexamSubjects.map(s => <option key={s._id} value={s._id}>{s.subject_name}</option>)}
            </select>
          </div>
        </div>
        {adminexamSelectedSubject ? (
          <div className="adminexam-view-section">
            <h2 className="adminexam-view-title">Student Marks</h2>
            <div className="adminexam-students-grid">
              {adminexamStudents.map(student => (
                <div key={student._id} className="adminexam-student-card">
                  <div className="adminexam-student-info">
                    <div className="adminexam-student-avatar">{student.name?.charAt(0)}</div>
                    <div className="adminexam-student-details">
                      <h4>{student.name}</h4>
                      <span>Student</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="adminexam-no-selection">
            <div className="adminexam-no-selection-icon">📝</div>
            <h3>Select Term, Class & Subject</h3>
            <p>Choose filters to view and record exam marks</p>
          </div>
        )}
        {adminexamShowModal && (
          <div className="adminexam-modal-overlay">
            <div className="adminexam-modal">
              <div className="adminexam-modal-header">
                <h2>Record Marks</h2>
                <button className="adminexam-close-btn" onClick={() => setAdminexamShowModal(false)}>×</button>
              </div>
              <form onSubmit={adminexamSubmitMarks} className="adminexam-modal-form">
                <div className="adminexam-form-group">
                  <label>Student:</label>
                  <select value={adminexamForm.student_id} onChange={(e) => setAdminexamForm({...adminexamForm, student_id: e.target.value})} required className="adminexam-form-select">
                    <option value="">Select Student</option>
                    {adminexamStudents.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="adminexam-form-row">
                  <div className="adminexam-form-group">
                    <label>Marks Obtained:</label>
                    <input type="number" value={adminexamForm.marks_obtained} onChange={(e) => setAdminexamForm({...adminexamForm, marks_obtained: e.target.value})} required className="adminexam-form-input" />
                  </div>
                  <div className="adminexam-form-group">
                    <label>Total Marks:</label>
                    <input type="number" value={adminexamForm.total_marks} onChange={(e) => setAdminexamForm({...adminexamForm, total_marks: e.target.value})} required className="adminexam-form-input" />
                  </div>
                </div>
                <div className="adminexam-modal-actions">
                  <button type="button" className="adminexam-btn adminexam-btn-outline" onClick={() => setAdminexamShowModal(false)}>Cancel</button>
                  <button type="submit" className="adminexam-btn adminexam-btn-primary">Submit Marks</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminExams;

