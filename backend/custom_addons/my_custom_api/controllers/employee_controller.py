# -*- coding: utf-8 -*-
import json
import logging
from odoo import http
from odoo.http import request, Response
from odoo.exceptions import AccessError

_logger = logging.getLogger(__name__)

class EmployeeController(http.Controller):

    def _get_full_profile_fields(self):
        """DANH SÁCH CÁC TRƯỜNG ĐẦY ĐỦ CHO ADMIN, MANAGER, VÀ CHÍNH MÌNH."""
        return [
            'name', 'job_title', 'mobile_phone', 'work_phone', 'work_email',
            'work_location_id', 'parent_id', 'coach_id', 'department_id',
            'address_id', 'private_street', 'private_street2', 'private_city',
            'private_state_id', 'private_zip', 'private_country_id', 'private_email',
            'private_phone', 'country_id', 'identification_id', 'ssnid',
            'passport_id', 'gender', 'birthday', 'place_of_birth',
            'country_of_birth', 'marital', 'spouse_complete_name',
            'spouse_birthdate', 'certificate', 'study_field', 'study_school',
            'children', 'emergency_contact', 'emergency_phone', 'visa_no',
            'permit_no', 'visa_expire', 'employee_type', 'pin', 'barcode',
            'image_1920', 'employee_skill_ids', 'resume_line_ids', 'user_id'
        ]

    def _get_basic_profile_fields(self):
        """
        MỚI: DANH SÁCH CÁC TRƯỜNG CƠ BẢN
        Khi một nhân viên xem thông tin của đồng nghiệp khác.
        """
        return [
            'name', 'job_title', 'work_phone', 'mobile_phone', 
            'work_email', 'department_id', 'image_1920'
        ]

    @http.route('/v1/employees/<int:employee_id>', type='http', auth='user', methods=['GET'], cors='*')
    def get_employee_profile(self, employee_id, **kw):
        """
        API LẤY THÔNG TIN NHÂN VIÊN ĐÃ ĐƯỢC NÂNG CẤP PHÂN QUYỀN
        """
        try:
            current_user = request.env.user
            current_employee = request.env['hr.employee'].search([('user_id', '=', current_user.id)], limit=1)
            target_employee = request.env['hr.employee'].browse(employee_id).exists()

            if not target_employee:
                return Response(json.dumps({'error': 'Employee not found'}), status=404, content_type='application/json')

            is_admin = current_user.has_group('base.group_system')
            is_own_profile = current_employee.id == target_employee.id
            is_manager = target_employee in current_employee.child_ids

            fields_to_read = []
            can_edit = False
            can_delete = False # MỚI: Thêm quyền xóa

            # Logic quyết định quyền và dữ liệu trả về
            if is_admin or is_own_profile:
                fields_to_read = self._get_full_profile_fields()
                can_edit = True
                can_delete = is_admin and not is_own_profile # Admin có thể xóa người khác, không thể tự xóa
            elif is_manager:
                fields_to_read = self._get_full_profile_fields()
                can_edit = False # Manager chỉ xem
                can_delete = False
            else: # Là nhân viên bình thường xem đồng nghiệp
                fields_to_read = self._get_basic_profile_fields()
                can_edit = False
                can_delete = False

            profile_data = target_employee.read(fields_to_read)[0]
            
            # Gói response lại trong một object để dễ quản lý ở frontend
            response_payload = {
                'profile': profile_data,
                'permissions': {
                    'can_edit': can_edit,
                    'can_delete': can_delete
                }
            }

            return Response(json.dumps(response_payload, default=str), status=200, content_type='application/json')

        except Exception as e:
            _logger.exception("API Error on get_employee_profile: %s", str(e))
            return Response(json.dumps({'error': 'Internal Server Error'}), status=500, content_type='application/json')

    @http.route('/v1/employees/<int:employee_id>', type='json', auth='user', methods=['PUT'], csrf=False)
    def update_employee_profile(self, employee_id, **kw):
        # API này không cần thay đổi nhiều, logic phân quyền đã được xử lý ở GET
        # Nhưng chúng ta vẫn cần kiểm tra lại quyền ở đây để đảm bảo an toàn
        current_user = request.env.user
        current_employee = request.env['hr.employee'].search([('user_id', '=', current_user.id)], limit=1)
        
        is_admin = current_user.has_group('base.group_system')
        is_own_profile = current_employee.id == employee_id

        if not (is_admin or is_own_profile):
            raise AccessError("Bạn không có quyền chỉnh sửa hồ sơ này.")
            
        target_employee = request.env['hr.employee'].browse(employee_id)
        if not target_employee.exists():
            return {'jsonrpc': '2.0', 'error': {'code': 404, 'message': 'Employee not found'}}
            
        data = request.jsonrequest
        target_employee.write(data)
        return {'message': 'Hồ sơ đã được cập nhật thành công.'}

    # MỚI: API ĐỂ VÔ HIỆU HÓA (XÓA MỀM) NHÂN VIÊN
    @http.route('/v1/employees/<int:employee_id>', type='http', auth='user', methods=['DELETE'], csrf=False, cors='*')
    def deactivate_employee(self, employee_id, **kw):
        """
        Chỉ Admin mới có quyền truy cập API này.
        Thay vì xóa cứng, chúng ta chỉ vô hiệu hóa bản ghi (active = False).
        """
        try:
            # Chỉ Admin hệ thống mới có quyền này
            if not request.env.user.has_group('base.group_system'):
                raise AccessError("Bạn không có quyền thực hiện hành động này.")

            target_employee = request.env['hr.employee'].browse(employee_id)
            if not target_employee.exists():
                return Response(json.dumps({'error': 'Employee not found'}), status=404, content_type='application/json')

            # Vô hiệu hóa nhân viên và người dùng liên quan
            target_employee.write({'active': False})
            if target_employee.user_id:
                target_employee.user_id.write({'active': False})

            return Response(json.dumps({'message': 'Nhân viên đã được vô hiệu hóa thành công.'}), status=200, content_type='application/json')

        except AccessError as e:
            return Response(json.dumps({'error': 'Forbidden', 'message': str(e)}), status=403, content_type='application/json')
        except Exception as e:
            _logger.exception("API Error on deactivate_employee: %s", str(e))
            return Response(json.dumps({'error': 'Internal Server Error'}), status=500, content_type='application/json')