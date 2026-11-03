import { createClient } from '@supabase/supabase-js';

// SCM_trade Supabase 프로젝트 설정
const SUPABASE_URL = 'https://jlednmkbglfeteuppffo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RyjWXkTXkQg6Jod4FsMO9g_vXBWCSeN';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const memberForm = document.getElementById('memberForm');
const submitBtn = document.getElementById('submitBtn');
const alertBox = document.getElementById('alertBox');
const memberTableBody = document.getElementById('memberTableBody');
const memberCount = document.getElementById('memberCount');
const refreshBtn = document.getElementById('refreshBtn');

// 전화번호 자동 하이픈 포맷팅
const phoneInput = document.getElementById('phone');
phoneInput.addEventListener('input', (e) => {
  let val = e.target.value.replace(/[^0-9]/g, '');
  if (val.length > 3 && val.length <= 7) {
    val = val.slice(0, 3) + '-' + val.slice(3);
  } else if (val.length > 7) {
    val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11);
  }
  e.target.value = val;
});

// 알림 메시지 표시 함수
function showAlert(message, type) {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  if (type === 'success') {
    setTimeout(() => {
      alertBox.style.display = 'none';
      alertBox.className = 'alert';
    }, 4000);
  }
}

// XSS 방지용 이스케이프 함수
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 회원 목록 조회 함수
async function fetchMembers() {
  const { data, error } = await supabaseClient
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    memberTableBody.innerHTML = `<tr><td colspan="4" class="empty-state" style="color: #dc2626;">목록 조회 오류: ${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  memberCount.textContent = data.length;

  if (data.length === 0) {
    memberTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">아직 등록된 회원이 없습니다. 왼쪽에서 첫 회원을 등록해 보세요!</td></tr>`;
    return;
  }

  memberTableBody.innerHTML = data.map((member) => {
    const dateStr = new Date(member.created_at).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `
      <tr>
        <td style="font-weight: 600;">${escapeHtml(member.name)}</td>
        <td>${escapeHtml(member.email)}</td>
        <td>${escapeHtml(member.phone)}</td>
        <td class="date-cell">${dateStr}</td>
      </tr>
    `;
  }).join('');
}

// 회원 등록 이벤트 핸들러
memberForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.className = 'alert';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();

  submitBtn.disabled = true;
  submitBtn.textContent = '등록 중...';

  const { error } = await supabaseClient
    .from('members')
    .insert([{ name, email, phone }]);

  submitBtn.disabled = false;
  submitBtn.textContent = '회원 등록하기';

  if (error) {
    if (error.code === '23505') {
      showAlert('이미 등록된 이메일 주소입니다.', 'error');
    } else {
      showAlert(`등록 실패: ${error.message}`, 'error');
    }
    return;
  }

  showAlert(`'${name}' 회원이 성공적으로 등록되었습니다!`, 'success');
  memberForm.reset();
  fetchMembers();
});

refreshBtn.addEventListener('click', fetchMembers);

// 초기 로드 시 회원 목록 불러오기
fetchMembers();
