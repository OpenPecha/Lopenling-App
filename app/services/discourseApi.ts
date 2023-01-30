import { db } from "~/utility/db.server";
import { v4 as uuidv4 } from "uuid";
import FormData from "form-data";

class DiscourseApi {
  DiscourseUrl: string;
  apiKey: string;
  username: string;
  constructor(username: string = "") {
    if (!process.env.DISCOURSE_API_KEY || !process.env.DISCOURSE_SITE)
      throw new Error("asign api and url  in env");

    this.DiscourseUrl = process.env.DISCOURSE_SITE;
    this.apiKey = process.env.DISCOURSE_API_KEY;
    this.username = username;
  }

  authHeader() {
    let auth_headers = {
      "Api-Key": this.apiKey,
      "Api-Username": this.username,
    };
    return auth_headers;
  }

  async fetchCategoryList(id: string | undefined) {
    const res = await fetch(
      `${this.DiscourseUrl}/categories.json?include_subcategories=true`
    );
    const categories = await res.json();
    const filterCategory = categories.category_list.categories.find(
      (l) => l?.id === parseInt(id)
    );
    if (!filterCategory.subcategory_ids.length) return null;
    return filterCategory.subcategory_list;
  }
  async fetchposts(topicId: number) {
    if (topicId) {
      const res = await fetch(`${this.DiscourseUrl}/t/${topicId}/posts.json`);
      const data = await res.json();
      return data;
    }
  }
  async fetchPostReplies(postId: number) {
    if (postId) {
      const res = await fetch(
        `${this.DiscourseUrl}/posts/${postId}/replies.json`
      );
      const data = await res.json();
      return data;
    }
  }
  async addCategory(categoryName: string, parent_category_id: number) {
    let auth_headers = this.authHeader();
    var randomColor = () => Math.floor(Math.random() * 16777215).toString(16);
    let newCategoryData = {
      name: categoryName,
      color: randomColor(),
      text_color: randomColor(),
      parent_category_id,
    };
    let params = new URLSearchParams(newCategoryData).toString();
    try {
      const response = await fetch(
        `${this.DiscourseUrl}/categories.json?` + params,
        {
          method: "POST",
          headers: auth_headers,
        }
      );
      let res = await response.json();
      return res;
    } catch (e) {
      console.log(e.message);
    }
  }
  async addTopic(
    username: string,
    category_id: number,
    start: number,
    end: number,
    topic_name: string | FormDataEntryValue,
    bodyContent: string,
    textId: number,
    type: string
  ) {
    let auth_headers = this.authHeader();
    let questionId = uuidv4();
    let url =
      process.env.ORIGIN_LOCATION +
      `/texts/${textId}?start=${start}&end=${end}`;
    let bodyContentWithLink = addLinktoQuestion(bodyContent, url);
    let post_text = `<div>
    <blockquote>${topic_name}</blockquote>
    <div>
<p>${bodyContentWithLink}</p>
<br/>
<iframe width="40" height="40" src="${process.env.ORIGIN_LOCATION}/embed/${questionId}"
></iframe><div>`;
    let new_Topic_data = {
      title: topic_name as string,
      category: category_id,
      raw: post_text,
    };
    let params = new URLSearchParams(new_Topic_data).toString();
    let user = await db.user.findUnique({
      where: {
        username,
      },
    });
    let data;
    try {
      const response = await fetch(
        `${this.DiscourseUrl}/posts.json?` + params,
        {
          method: "POST",
          mode: "cors", // no-cors, *cors, same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          credentials: "same-origin",
          headers: auth_headers,
        }
      );
      data = await response.json();
      if (data["topic_id"] > 0 && user) {
        const createQuestion = await db.post.create({
          data: {
            id: questionId,
            type: type,
            avatar: data["avatar_template"],
            topic_id: data["topic_id"],
            post_id: data.id,
            start,
            end,
            text_id: textId,
            content: bodyContent,
            creatorUser_id: user.id,
          },
        });
      }
    } catch (e) {
      console.log(e);
    }

    return data;
  }

  async createPost(TopicId: number, postString: string) {
    let auth_headers = this.authHeader();

    try {
      let newPostData = {
        topic_id: TopicId,
        raw: postString,
      };
      let params = new URLSearchParams(newPostData).toString();

      const response = await fetch(
        `${this.DiscourseUrl}/posts.json?` + params,
        {
          method: "post",
          headers: auth_headers,
        }
      );
      return response;
    } catch (e) {
      console.log(e);
    }
  }
  async deletePost(postId: number) {
    let auth_headers = this.authHeader();

    try {
      const response = await fetch(
        `${this.DiscourseUrl}/posts/${postId}.json`,
        {
          method: "delete",
          headers: auth_headers,
        }
      );
      return response.status;
    } catch (e) {
      console.log(e);
    }
  }

  async deleteTopic(id: number) {
    let auth_headers = this.authHeader();
    try {
      const response = await fetch(`${this.DiscourseUrl}/t/${id}.json`, {
        method: "DELETE",
        headers: auth_headers,
      });
      return response.status;
    } catch (e) {
      console.log(e);
    }
  }
  async uploadFile(formData: any) {
    let auth_headers = this.authHeader();
    try {
      let res = await fetch(`${this.DiscourseUrl}/uploads.json`, {
        method: "POST",
        headers: auth_headers,
        body: formData,
      });
      if (res.status === 200) {
        let data = await res.json();
        return data.url;
      }
    } catch (e) {
      console.log("upload Failed" + e.message);
    }
  }
}

export async function createThread(
  userName: string,
  postTitle: string,
  blockquoteArea: string,
  postContent: string,
  start: string,
  end: string,
  parent_category_id: string,
  textId: number,
  type: string
) {
  if (!start || !end) {
    throw new Error("start and end values not available");
  }
  if (!postTitle || !blockquoteArea || !postContent)
    throw new Error("failed to access Topic Id");
  const apiObj: DiscourseApi = new DiscourseApi(userName);
  let response = await apiObj.fetchCategoryList(parent_category_id);
  let checkIfCategoryPresent = response?.find((l: any) => l.name === postTitle);
  if (!checkIfCategoryPresent) {
    let res = await apiObj.addCategory(postTitle, parseInt(parent_category_id));
    checkIfCategoryPresent = {
      id: res.category?.id,
    };
  }
  return apiObj.addTopic(
    userName,
    checkIfCategoryPresent.id,
    parseInt(start as string),
    parseInt(end as string),
    blockquoteArea,
    postContent as string,
    textId,
    type
  );
}

function addLinktoQuestion(question: string, url: string) {
  return `<a href="${url}" target='_blank'>${question}</a>`;
}
export async function deleteQuestion(userName: string, topicId: number) {
  const apiObj: DiscourseApi = new DiscourseApi(userName);
  const res = apiObj.deleteTopic(topicId, userName);
  return res;
}

export async function getposts(topicId: number, username: string) {
  const apiObj: DiscourseApi = new DiscourseApi(username);
  const res = apiObj.fetchposts(topicId);
  return res;
}
export async function getpostreplies(topicId: number) {
  const apiObj: DiscourseApi = new DiscourseApi();
  const res = apiObj.fetchPostReplies(topicId);
  return res;
}
export async function uploadFile(username: string, formData: any) {
  const apiObj: DiscourseApi = new DiscourseApi(username);
  const res = apiObj.uploadFile(formData);
  return res;
}
export async function createPost(
  topicId: number,
  postString: string,
  username: string
) {
  const apiObj: DiscourseApi = new DiscourseApi(username);
  const res = apiObj.createPost(topicId, postString);
  return res;
}
export async function deletePost(postId: number, username: string) {
  const apiObj: DiscourseApi = new DiscourseApi(username);

  const res = apiObj.deletePost(postId);
  return res;
}

export default DiscourseApi;