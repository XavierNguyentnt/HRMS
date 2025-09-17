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
        
        # controllers/employee_controller.py

    # custom_addons/my_custom_api/controllers/employee_controller.py

    @http.route('/api/employee/register', type='json', auth='public', methods=['POST'], csrf=False)
    def register_employee(self, **kw):
        data = request.jsonrequest

        # Bọc toàn bộ logic trong try-except để bắt mọi lỗi và trả về thông báo rõ ràng
        try:
            # 1. Tìm email trong danh sách được duyệt trước
            preapproved = request.env['hr.preapproved.employee'].sudo().search([
                ('email', '=ilike', data.get('email')),
                ('state', '=', 'new')
            ])

            if not preapproved:
                # Trả về lỗi có chủ đích, không gây crash server
                return {'error': 'Email của bạn không hợp lệ hoặc đã được sử dụng để đăng ký.'}

            # 2. Tạo User ở trạng thái chưa kích hoạt VÀ không thuộc nhóm nào
            # Đây là cách tạo user an toàn nhất để chờ phê duyệt.
            new_user = request.env['res.users'].with_context(no_reset_password=True).create({
                'name': data.get('name'),
                'login': data.get('email'),
                'password': data.get('password'),
                'active': False, # Tạo user không hoạt động
                'groups_id': [(6, 0, [])] # KHÔNG gán vào nhóm nào cả
            })

            # 3. Tạo Hồ sơ nhân viên và liên kết
            new_employee = request.env['hr.employee'].create({
                'name': data.get('name'),
                'work_email': data.get('email'),
                'user_id': new_user.id,
            })

            # 4. Cập nhật trạng thái email
            preapproved.write({'state': 'registered'})

            return {'success': True, 'message': 'Đăng ký thành công! Tài khoản của bạn đang chờ quản trị viên phê duyệt.'}

        except Exception as e:
            # Bắt tất cả các lỗi khác có thể xảy ra và báo lại cho frontend
            _logger.error(f"Registration failed for email {data.get('email')}: {str(e)}")
            request.env.cr.rollback()
            return {'error': f'Đã xảy ra lỗi ở server: {str(e)}'}
        
    class WhitelistApiController(http.Controller):
    
        # API để LẤY danh sách whitelist
        @http.route('/api/whitelist', type='json', auth='user', methods=['GET'], csrf=False)
        def get_whitelist(self):
            # Kiểm tra quyền hạn: Chỉ Admin nhân sự mới được xem
            if not request.env.user.has_group('hr.group_hr_manager'):
                raise AccessError("Bạn không có quyền truy cập tài nguyên này.")
            
            whitelist_records = request.env['hr.preapproved.employee'].search_read(
                [], ['id', 'name', 'email', 'state']
            )
            return whitelist_records

    # API để THÊM một email mới vào whitelist
    @http.route('/api/whitelist', type='json', auth='user', methods=['POST'], csrf=False)
    def add_to_whitelist(self):
        if not request.env.user.has_group('hr.group_hr_manager'):
            raise AccessError("Bạn không có quyền thực hiện hành động này.")
        
        data = request.jsonrequest
        if not data.get('email') or not data.get('name'):
            return {'error': 'Vui lòng cung cấp đủ tên và email.'}
        
        try:
            new_entry = request.env['hr.preapproved.employee'].create({
                'name': data.get('name'),
                'email': data.get('email'),
            })
            return {'success': True, 'id': new_entry.id, 'name': new_entry.name, 'email': new_entry.email}
        except Exception as e:
            request.env.cr.rollback()
            return {'error': str(e)}

    # API để XÓA một email khỏi whitelist
    @http.route('/api/whitelist/<int:entry_id>', type='json', auth='user', methods=['DELETE'], csrf=False)
    def remove_from_whitelist(self, entry_id):
        if not request.env.user.has_group('hr.group_hr_manager'):
            raise AccessError("Bạn không có quyền thực hiện hành động này.")
        
        entry = request.env['hr.preapproved.employee'].browse(entry_id)
        if not entry.exists():
            return {'error': 'Không tìm thấy mục để xóa.'}
        
        entry.unlink()
        return {'success': True, 'message': 'Đã xóa thành công.'}
