import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { getCurrentStudentUser } from "@/lib/auth/user-context";
import {
  getScholarshipSourceForApplication,
  replaceApplicationQuestions,
  updateScholarshipExtraction,
} from "@/lib/scholarships/application-repository";
import { extractScholarshipDetails } from "@/lib/scholarships/extraction";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentStudentUser(request);

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const source = await getScholarshipSourceForApplication(user.id, id);

  if (!source.sourceText.trim()) {
    return badRequest("Scholarship source text is empty");
  }

  const extracted = extractScholarshipDetails(source.sourceText);

  await replaceApplicationQuestions(id, user.id, extracted.questions);
  await updateScholarshipExtraction(
    source.scholarshipId,
    extracted.deadline,
    "completed",
  );

  return ok({
    questionCount: extracted.questions.length,
    deadline: extracted.deadline,
  });
}
